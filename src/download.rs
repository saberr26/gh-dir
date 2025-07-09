use crate::github::GitHubFile;
use futures_util::stream::{self, StreamExt};
use indicatif::{ProgressBar, ProgressStyle};
use reqwest::Client;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::fs::{self, File};
use tokio::io::AsyncWriteExt;
use zip::write::{FileOptions, ZipWriter};

async fn download_file_with_retry(
    client: Arc<Client>,
    file: GitHubFile,
    output_path: PathBuf,
    pb: ProgressBar,
) -> anyhow::Result<()> {
    if let Some(download_url) = file.download_url {
        let max_retries = 3;
        let mut retry_count = 0;
        
        loop {
            match client.get(&download_url).send().await {
                Ok(response) => {
                    if !response.status().is_success() {
                        anyhow::bail!(
                            "Failed to download file: {}\nStatus: {}\nURL: {}",
                            file.path,
                            response.status(),
                            download_url
                        );
                    }
                    
                    match response.bytes().await {
                        Ok(content) => {
                            let file_path = output_path.join(&file.path);
                            if let Some(parent) = file_path.parent() {
                                fs::create_dir_all(parent).await?;
                            }
                            let mut f = File::create(&file_path).await?;
                            f.write_all(&content).await?;
                            pb.inc(file.size);
                            break;
                        }
                        Err(e) => {
                            retry_count += 1;
                            if retry_count >= max_retries {
                                anyhow::bail!("Failed to download {} after {} retries: {}", file.path, max_retries, e);
                            }
                            tokio::time::sleep(Duration::from_millis(100 * retry_count)).await;
                        }
                    }
                }
                Err(e) => {
                    retry_count += 1;
                    if retry_count >= max_retries {
                        anyhow::bail!("Failed to download {} after {} retries: {}", file.path, max_retries, e);
                    }
                    tokio::time::sleep(Duration::from_millis(100 * retry_count)).await;
                }
            }
        }
    }
    Ok(())
}

pub async fn download_files(
    files: Vec<GitHubFile>,
    output_path: &str,
    concurrency: u8,
    as_zip: bool,
) -> anyhow::Result<()> {
    
    let client = Arc::new(
        Client::builder()
            .pool_max_idle_per_host(20)
            .pool_idle_timeout(Duration::from_secs(30))
            .timeout(Duration::from_secs(30))
            .connection_verbose(false)
            .tcp_keepalive(Duration::from_secs(10))
            .http1_only() // Force HTTP/1.1 to avoid HTTP/2 frame issues
            .user_agent("Mozilla/5.0 (compatible; downloader/1.0)")
            .build()?
    );
    
    let output_path = Path::new(output_path).to_path_buf();
    
    if !output_path.exists() {
        fs::create_dir_all(&output_path).await?;
    }
    
    let total_size = files.iter().map(|f| f.size).sum();
    let pb = ProgressBar::new(total_size);
    
    pb.set_style(
        ProgressStyle::default_bar()
        .template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.blue/cyan}] {bytes}/{total_bytes} ({bytes_per_sec}, {eta})")
        .unwrap()
        .progress_chars("██▓▒░"),
    );
    
    if as_zip {
        let zip_file_path = if output_path.is_dir() {
            output_path.join("archive.zip")
        } else {
            output_path
        };
        let zip_file = std::fs::File::create(&zip_file_path)?;
        let mut zip = ZipWriter::new(zip_file);
        let options = FileOptions::default().compression_method(zip::CompressionMethod::Stored);
        
        let mut downloads = Vec::new();
        for file in files {
            if let Some(download_url) = file.download_url {
                let client_clone = Arc::clone(&client);
                let pb_clone = pb.clone();
                let download = tokio::spawn(async move {
                    let max_retries = 3;
                    let mut retry_count = 0;
                    
                    loop {
                        match client_clone.get(&download_url).send().await {
                            Ok(response) => {
                                match response.bytes().await {
                                    Ok(content) => {
                                        pb_clone.inc(file.size);
                                        return Ok::<_, anyhow::Error>((file.path, content));
                                    }
                                    Err(e) => {
                                        retry_count += 1;
                                        if retry_count >= max_retries {
                                            return Err(anyhow::anyhow!("Failed after {} retries: {}", max_retries, e));
                                        }
                                        tokio::time::sleep(Duration::from_millis(100 * retry_count)).await;
                                    }
                                }
                            }
                            Err(e) => {
                                retry_count += 1;
                                if retry_count >= max_retries {
                                    return Err(anyhow::anyhow!("Failed after {} retries: {}", max_retries, e));
                                }
                                tokio::time::sleep(Duration::from_millis(100 * retry_count)).await;
                            }
                        }
                    }
                });
                downloads.push(download);
            }
        }
        
        for download in downloads {
            let (path, content) = download.await??;
            zip.start_file(path, options)?;
            zip.write_all(&content)?;
        }
        zip.finish()?;
    } else {
        
        let effective_concurrency = std::cmp::min(concurrency as usize, 10);
        
        stream::iter(files)
            .for_each_concurrent(effective_concurrency, |file| {
                let client = Arc::clone(&client);
                let output_path = output_path.clone();
                let pb = pb.clone();
                async move {
                    if let Err(e) = download_file_with_retry(client, file, output_path, pb).await {
                        eprintln!("{} {}", console::style("Error downloading file:").red().bold(), e);
                    }
                }
            })
            .await;
    }
    
    pb.finish_with_message("⚡ Download complete! ⚡!");
    Ok(())
}
