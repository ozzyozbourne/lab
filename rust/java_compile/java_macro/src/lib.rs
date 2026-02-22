use proc_macro::TokenStream;
use std::io::Write;
use std::process::Command;

#[proc_macro]
pub fn run_java(input: TokenStream) -> TokenStream {
    // Parse the tokens — grab all Idents and join them
    let message: String = input
        .into_iter()
        .filter_map(|token| match token {
            proc_macro::TokenTree::Ident(ident) => Some(ident.to_string()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join(" ");

    // Write Java source to a temp file
    let dir = std::env::temp_dir();
    let java_file = dir.join("CompileGreet.java");

    let java_code = format!(
        r#"
        public class CompileGreet {{
            public static void main(String[] args) {{
                System.out.print("Hello World " + "{}");
            }}
        }}
        "#,
        message
    );

    std::fs::File::create(&java_file)
        .unwrap()
        .write_all(java_code.as_bytes())
        .unwrap();

    // Compile Java
    let compile_status = Command::new("javac")
        .arg(java_file.to_str().unwrap())
        .status()
        .expect("Failed to run javac — is Java installed?");

    if !compile_status.success() {
        panic!("javac compilation failed!");
    }

    // Run Java
    let run_output = Command::new("java")
        .args(["-cp", dir.to_str().unwrap(), "CompileGreet"])
        .output()
        .expect("Failed to run java");

    if !run_output.status.success() {
        let stderr = String::from_utf8_lossy(&run_output.stderr);
        panic!("Java execution failed: {}", stderr);
    }

    let java_result = String::from_utf8(run_output.stdout).unwrap();

    // Print during compilation so you can see it
    eprintln!("=== Java said at compile time: {} ===", java_result);

    // Generate Rust code that embeds Java's output
    let rust_code = format!(r#"const JAVA_MESSAGE: &str = "{}";"#, java_result);

    rust_code.parse().unwrap()
}
