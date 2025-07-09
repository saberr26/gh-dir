use crate::github::GitHubFile;
use futures_util::stream::{self, StreamExt};
use indicatif::{ProgressBar, ProgressStyle};
use reqwest::Client;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::fs::{self, File};
use tokio::io::AsyncWriteExt;
use zip::write::{FileOptions, ZipWriter};

async fn download_file(
    client: Arc<Client>,
    file: GitHubFile,
    output_path: PathBuf,
    pb: ProgressBar,
) -> anyhow::Result<()> {
    if let Some(download_url) = file.download_url {
        let response = client.get(&download_url).send().await?;
        if !response.status().is_success() {
            anyhow::bail!(
                "Failed to download file: {}\nStatus: {}\nURL: {}",
                file.path,
                response.status(),
                download_url
            );
        }
        let content = response.bytes().await?;

        let file_path = output_path.join(&file.path);
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        let mut f = File::create(&file_path).await?;
        f.write_all(&content).await?;
        pb.inc(file.size);
    }

    Ok(())
}

pub async fn download_files(
    files: Vec<GitHubFile>,
    output_path: &str,
    concurrency: u8,
    as_zip: bool,
) -> anyhow::Result<()> {
    let client = Arc::new(Client::new());
    let output_path = Path::new(output_path).to_path_buf();

    if !output_path.exists() {
        fs::create_dir_all(&output_path).await?;
    }

    let total_size = files.iter().map(|f| f.size).sum();
    let pb = ProgressBar::new(total_size);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({eta})")?
            .progress_chars("##-"),
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

        for file in files {
            if let Some(download_url) = file.download_url {
                let response = client.get(&download_url).send().await?;
                let content = response.bytes().await?;
                zip.start_file(file.path, options)?;
                zip.write_all(&content)?;
                pb.inc(file.size);
            }
        }
        zip.finish()?;
    } else {
        stream::iter(files)
            .for_each_concurrent(concurrency as usize, |file| {
                let client = Arc::clone(&client);
                let output_path = output_path.clone();
                let pb = pb.clone();
                async move {
                    if let Err(e) = download_file(client, file, output_path, pb).await {
                        eprintln!("{} {}", console::style("Error downloading file:").red().bold(), e);
                    }
                }
            })
            .await;
    }

    pb.finish_with_message("Download complete");
    Ok(())
}