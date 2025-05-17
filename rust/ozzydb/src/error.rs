use serde::{Deserialize, Serialize};
use std::fmt::Display;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum Error {
    Abort,
    InvalidData(String),
    InvalidInput(String),
    IO(String),
    ReadOnly,
    Serialization,
}

impl std::error::Error for Error {}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Error::Abort => write!(f, "operation aborted"),
            Error::InvalidData(msg) => write!(f, "invalid data: {msg}"),
            Error::InvalidInput(msg) => write!(f, "invalid input: {msg}"),
            Error::IO(msg) => write!(f, "invalid input: {msg}"),
            Error::ReadOnly => write!(f, "read-only transaction"),
            Error::Serialization => write!(f, "serialization failure, retry transaction"),
        }
    }
}
