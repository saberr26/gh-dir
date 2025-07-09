use futures_util::future::try_join_all;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use serde::Deserialize;
use thiserror::Error;
use url::Url;

#[derive(Debug, Clone)]
pub struct RepositoryInfo {
    pub user: String,
    pub repository: String,
    pub git_reference: Option<String>,
    pub directory: String,
}

#[derive(Error, Debug)]
pub enum RepoInfoError {
    #[error("Invalid GitHub URL: {0}")]
    InvalidUrl(String),
    #[error("URL does not point to a repository: {0}")]
    NotARepository(String),
}

#[derive(Deserialize, Debug, Clone)]
pub struct GitHubFile {
    pub path: String,
    pub name: String,
    #[serde(rename = "type")]
    pub file_type: String, // "file" or "dir"
    pub download_url: Option<String>,
    pub sha: String,
    pub size: u64,
}

pub async fn get_repository_info(url: &str) -> Result<RepositoryInfo, RepoInfoError> {
    let parsed_url = Url::parse(url).map_err(|e| RepoInfoError::InvalidUrl(e.to_string()))?;

    if parsed_url.host_str() != Some("github.com") {
        return Err(RepoInfoError::InvalidUrl("Not a GitHub URL".to_string()));
    }

    let path_segments: Vec<&str> = parsed_url
        .path_segments()
        .ok_or_else(|| RepoInfoError::NotARepository("URL path is empty".to_string()))?
        .collect();

    if path_segments.len() < 2 {
        return Err(RepoInfoError::NotARepository(
            "URL path does not contain user and repository".to_string(),
        ));
    }

    let user = path_segments[0].to_string();
    let repository = path_segments[1].to_string();
    let (git_reference, directory) = if path_segments.len() > 3 && path_segments[2] == "tree" {
        (Some(path_segments[3].to_string()), path_segments[4..].join("/"))
    } else {
        (None, path_segments[2..].join("/"))
    };

    let repo_info = RepositoryInfo {
        user,
        repository,
        git_reference,
        directory,
    };

    Ok(repo_info)
}

async fn list_files_in_dir(
    repo_info: &RepositoryInfo,
    token: &Option<String>,
    path: &str,
) -> anyhow::Result<Vec<GitHubFile>> {
    let client = reqwest::Client::new();
    let api_url = format!(
        "https://api.github.com/repos/{}/{}/contents/{}",
        repo_info.user,
        repo_info.repository,
        path
    );

    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_static("gh-dir-rust-cli"));
    if let Some(token) = token {
        let auth_header = format!("token {}", token);
        headers.insert(
            "Authorization",
            HeaderValue::from_str(&auth_header)?,
        );
    }

    let response = client.get(&api_url).headers(headers).send().await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_else(|_| "Could not read response body".to_string());
        match status {
            reqwest::StatusCode::NOT_FOUND => {
                anyhow::bail!("Repository or directory not found (404). Please check the URL and that the resource exists.")
            }
            reqwest::StatusCode::FORBIDDEN | reqwest::StatusCode::UNAUTHORIZED => {
                anyhow::bail!("Permission denied (403/401). If the repository is private, please provide a valid personal access token with the --token option.")
            }
            _ => {
                anyhow::bail!(
                    "GitHub API request failed with status {}:\n{}",
                    status,
                    body
                )
            }
        }
    }

    let files: Vec<GitHubFile> = response.json().await?;
    Ok(files)
}

pub async fn get_all_files(
    repo_info: &RepositoryInfo,
    token: &Option<String>,
) -> anyhow::Result<(Vec<GitHubFile>, u64)> {
    let mut all_files = Vec::new();
    let mut total_size = 0;
    let mut dirs_to_visit = vec![repo_info.directory.clone()];

    while let Some(dir) = dirs_to_visit.pop() {
        let files = list_files_in_dir(repo_info, token, &dir).await?;

        let mut dir_futures = Vec::new();

        for file in files {
            if file.file_type == "dir" {
                dir_futures.push(get_all_files_recursive(repo_info.clone(), token.clone(), file.path));
            } else {
                total_size += file.size;
                all_files.push(file);
            }
        }

        let sub_dir_files = try_join_all(dir_futures).await?;
        for (sub_files, sub_size) in sub_dir_files {
            all_files.extend(sub_files);
            total_size += sub_size;
        }
    }

    Ok((all_files, total_size))
}

async fn get_all_files_recursive(
    repo_info: RepositoryInfo,
    token: Option<String>,
    path: String,
) -> anyhow::Result<(Vec<GitHubFile>, u64)> {
    let mut all_files = Vec::new();
    let mut total_size = 0;
    let files = list_files_in_dir(&repo_info, &token, &path).await?;

    let mut dir_futures = Vec::new();

    for file in files {
        if file.file_type == "dir" {
            dir_futures.push(get_all_files_recursive(repo_info.clone(), token.clone(), file.path));
        } else {
            total_size += file.size;
            all_files.push(file);
        }
    }

    let sub_dir_files = try_join_all(dir_futures).await?;
    for (sub_files, sub_size) in sub_dir_files {
        all_files.extend(sub_files);
        total_size += sub_size;
    }

    Ok((all_files, total_size))
}