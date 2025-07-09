use clap::{Args, Parser, Subcommand};
use console::{style, Term};
use dialoguer::Confirm;
use indicatif::{ProgressBar, ProgressStyle};
use std::time::Duration;

mod download;
mod github;

/// A Rust CLI to download GitHub directories
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Clone a GitHub directory
    #[command(alias = "c")]
    Clone(CloneArgs),
}

#[derive(Args, Debug)]
struct CloneArgs {
    /// GitHub URL of the directory to download
    url: String,

    /// Output directory or zip file
    #[arg(default_value = ".")]
    output: String,

    /// GitHub personal access token for private repos
    #[arg(short, long)]
    token: Option<String>,

    /// Download as zip file instead of extracting files
    #[arg(short, long)]
    zip: bool,

    /// Number of concurrent downloads
    #[arg(short, long, default_value_t = 10)]
    concurrency: u8,

    /// Enable debug output
    #[arg(short, long)]
    debug: bool,

    /// Display plain output without boxes
    #[arg(short, long)]
    plain: bool,

    /// Limit the number of files shown in preview
    #[arg(long, default_value_t = 20)]
    preview_limit: usize,

    /// Skip confirmation prompt
    #[arg(short = 'y', long)]
    yes: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Clone(args) => {
            if let Err(e) = run_clone(&args).await {
                eprintln!("{} {}", style("Error:").red().bold(), e);
                std::process::exit(1);
            }
        }
    }

    Ok(())
}

async fn run_clone(args: &CloneArgs) -> anyhow::Result<()> {
    let term = Term::stdout();
    term.write_line(&format!(
        "{} {}",
        style("gh-dir-rust").green().bold(),
        style("Cloning a GitHub directory...").bold()
    ))?;

    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::default_spinner().template("{spinner:.green} {msg}")?);
    spinner.set_message("Analyzing repository...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let repo_info = github::get_repository_info(&args.url).await?;
    spinner.set_message(format!(
        "Repository: {}/{}",
        style(repo_info.user.clone()).cyan().bold(),
        style(repo_info.repository.clone()).cyan().bold()
    ));

    let (files, total_size) = github::get_all_files(&repo_info, &args.token).await?;
    spinner.finish_with_message(format!("Found {} files.", style(files.len()).cyan().bold()));

    // Preview files - use the original approach but with better box drawing
    if args.plain {
        show_plain_preview(&files, total_size, args.preview_limit)?;
    } else {
        show_boxed_preview(&files, total_size, args.preview_limit)?;
    }

    // Ask for confirmation unless --yes flag is used
    if !args.yes {
        if !Confirm::new()
            .with_prompt(format!("{}", style("Continue?").green().bold()))
            .default(true)
            .interact()? 
        {
            term.write_line(&format!("{}", style("Aborting.").red().bold()))?;
            return Ok(());
        }
    }

    download::download_files(files, &args.output, args.concurrency, args.zip).await?;

    term.write_line(&format!("\n{}", style("Done!").green().bold()))?;

    Ok(())
}

fn show_plain_preview(files: &[github::GitHubFile], total_size: u64, limit: usize) -> anyhow::Result<()> {
    let term = Term::stdout();
    
    term.write_line(&format!("\n{}", style("Files to be downloaded:").bold()))?;
    
    let display_count = std::cmp::min(files.len(), limit);
    
    for file in files.iter().take(display_count) {
        term.write_line(&format!("  {}", style(&file.path).cyan()))?;
    }
    
    if files.len() > limit {
        term.write_line(&format!("  {} ({} more files not shown)", 
            style("...").dim(), 
            style(files.len() - limit).dim()))?;
    }
    
    term.write_line(&format!("\n{} {}", 
        style("Total size:").bold(), 
        style(format_size(total_size)).cyan().bold()))?;
    
    Ok(())
}

fn show_boxed_preview(files: &[github::GitHubFile], total_size: u64, limit: usize) -> anyhow::Result<()> {
    let term = Term::stdout();
    
    // Prepare file list content
    let mut file_list_content = String::new();
    let display_count = std::cmp::min(files.len(), limit);
    
    for file in files.iter().take(display_count) {
        file_list_content.push_str(&format!("{}\n", file.path));
    }
    
    if files.len() > limit {
        file_list_content.push_str(&format!("... ({} more files not shown)\n", files.len() - limit));
    }

    let boxed_content = draw_box(
        &file_list_content.trim_end(),
        "Files to be downloaded",
        format_size(total_size),
    );
    term.write_line(&boxed_content)?;
    
    Ok(())
}

fn draw_box(content: &str, title: &str, total_size_str: String) -> String {
    use console::{style, measure_text_width};
    
    let lines: Vec<&str> = content.lines().collect();
    
    // Calculate the required inner width (content width) using unstyled text
    let title_len = measure_text_width(title);
    let total_size_label_text = "Total size:";
    let total_size_label_len = measure_text_width(total_size_label_text);
    let total_size_str_len = measure_text_width(&total_size_str);
    
    // Find the maximum content width needed
    let max_line_width = lines
        .iter()
        .map(|l| measure_text_width(l))
        .max()
        .unwrap_or(0);
    
    let total_size_line_width = total_size_label_len + 1 + total_size_str_len; // +1 for space
    
    // The inner width should accommodate all content
    let inner_width = max_line_width
        .max(title_len)
        .max(total_size_line_width);
    
    // Add small buffer for safety and ensure minimum width
    let inner_width = (inner_width + 2).max(20); // Minimum width of 20
    
    // The horizontal line needs to account for the spaces around content
    let horizontal_line = "─".repeat(inner_width + 2); // +2 for spaces around content
    let mut boxed_string = String::new();
    
    // Top border: ╭────────╮
    boxed_string.push_str(&format!(
        "{}\n",
        style(format!("╭{}╮", horizontal_line)).blue().bold()
    ));
    
    // Title line: │  Title  │
    let title_padded = format!("{:^width$}", title, width = inner_width);
    boxed_string.push_str(&format!(
        "{} {} {}\n",
        style("│").blue().bold(),
        style(title_padded).bold().cyan(),
        style("│").blue().bold()
    ));
    
    // Separator below title: ├────────┤
    boxed_string.push_str(&format!(
        "{}\n",
        style(format!("├{}┤", horizontal_line)).blue().bold()
    ));
    
    // Content lines: │ content │
    for line in lines {
        let line_padded = format!("{:<width$}", line, width = inner_width);
        boxed_string.push_str(&format!(
            "{} {} {}\n",
            style("│").blue().bold(),
            style(line_padded).cyan(),
            style("│").blue().bold()
        ));
    }
    
    // Separator above total size: ├────────┤
    boxed_string.push_str(&format!(
        "{}\n",
        style(format!("├{}┤", horizontal_line)).blue().bold()
    ));
    
    // Total size line: │ Total size: 26.33 KB │
    let total_size_line_content = format!(
        "{} {:>width$}",
        total_size_label_text,
        total_size_str,
        width = inner_width - total_size_label_len - 1 // -1 for space between label and value
    );
    boxed_string.push_str(&format!(
        "{} {} {}\n",
        style("│").blue().bold(),
        style(total_size_line_content).bold().cyan(),
        style("│").blue().bold()
    ));
    
    // Bottom border: ╰────────╯
    boxed_string.push_str(&format!(
        "{}",
        style(format!("╰{}╯", horizontal_line)).blue().bold()
    ));
    
    boxed_string
}
fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * KB;
    const GB: u64 = 1024 * MB;
    const TB: u64 = 1024 * GB;

    if bytes >= TB {
        format!("{:.2} TB", bytes as f64 / TB as f64)
    } else if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_size() {
        assert_eq!(format_size(0), "0 B");
        assert_eq!(format_size(512), "512 B");
        assert_eq!(format_size(1024), "1.00 KB");
        assert_eq!(format_size(1536), "1.50 KB");
        assert_eq!(format_size(1048576), "1.00 MB");
        assert_eq!(format_size(1073741824), "1.00 GB");
        assert_eq!(format_size(1099511627776), "1.00 TB");
    }

    #[test]
    fn test_box_drawing_alignment() {
        let content = "file1.txt\nfile2.txt\nvery_long_filename_here.txt";
        let result = draw_box(content, "Test Files", "1.23 KB".to_string());
        
        println!("{}", result);
        
        // Check basic structure
        assert!(result.contains("╭"));
        assert!(result.contains("╮"));
        assert!(result.contains("╰"));
        assert!(result.contains("╯"));
        assert!(result.contains("Test Files"));
        assert!(result.contains("Total size:"));
        assert!(result.contains("1.23 KB"));
        
        // Check that each line has the same visible width
        let lines: Vec<&str> = result.lines().collect();
        
        // All lines should end with the same character patterns
        for line in &lines {
            if line.contains("│") {
                assert!(line.ends_with("│") || line.contains("┤") || line.contains("╮") || line.contains("╯"));
            }
        }
    }
}
