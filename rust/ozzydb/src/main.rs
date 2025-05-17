mod error;

use {
    log::info,
    std::{collections::BTreeMap, fs::File, path::PathBuf, result::Result as StdResult},
};

type KeyDir = BTreeMap<Vec<u8>, ValueLocation>;

pub struct BitCast {
    log: Log,
    keydir: KeyDir,
}

#[derive(Debug, Clone, Copy)]
struct ValueLocation {
    offset: u64,
    lenght: usize,
}

struct Log {
    file: File,
    path: PathBuf,
}

impl ValueLocation {
    fn end(&self) -> u64 {
        self.offset + self.lenght as u64
    }
}

impl BitCast {
    pub fn new(path: PathBuf) -> Result<Self> {
        info!()
    }
}

fn main() {}
