fn main() {
    println!("Hello Rustaceans!");
}

// in rust we can easy blend both functional and impertive style seamlessly
mod functional_and_imperative {
    use std::collections::HashMap;

    pub fn group_anagrams_functional_style(strs: Vec<String>) -> Vec<Vec<String>> {
        strs.into_iter()
            .fold(HashMap::<[u8; 26], Vec<String>>::new(), |mut m, s| {
                let cnt = s.as_bytes().iter().fold([0; 26], |mut cnt, c| {
                    cnt[(c - b'a') as usize] += 1;
                    cnt
                });
                m.entry(cnt).or_default().push(s);
                m
            })
            .into_values()
            .collect()
    }

    pub fn group_anagrams_imperative_style(strs: Vec<String>) -> Vec<Vec<String>> {
        let mut m = HashMap::<[u8; 26], Vec<String>>::new();
        for s in strs {
            let mut cnt = [0; 26];
            for c in s.bytes() {
                cnt[(c - b'a') as usize] += 1;
            }
            m.entry(cnt).or_default().push(s);
        }
        m.into_values().collect()
    }

    pub fn length_of_longest_substring(s: String) -> i32 {
        s.as_bytes()
            .into_iter()
            .enumerate()
            .fold(
                (0, 0, HashMap::<u8, usize>::new()),
                |(mut l, res, mut m), (r, b)| {
                    l = match m.get(b) {
                        Some(v) => l.max(v + 1),
                        None => l,
                    };
                    _ = m.insert(*b, r);
                    (l, res.max(r - l + 1), m)
                },
            )
            .1 as _
    }

    pub fn length_of_longest_substring_imperative_style(s: String) -> i32 {
        let (mut l, mut res, mut map) = (0, 0, HashMap::<u8, usize>::new());
        for (r, b) in s.as_bytes().into_iter().enumerate() {
            if map.contains_key(b) {
                l = l.max(map.get(b).unwrap() + 1);
            }
            map.insert(*b, r);
            res = res.max(r - l + 1);
        }
        res as _
    }
}
