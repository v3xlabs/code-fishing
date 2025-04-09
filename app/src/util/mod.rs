use rand::Rng;

//
pub fn generate_secret() -> String {
    let mut rng = rand::thread_rng();
    let mut secret = String::new();
    for _ in 0..8 {
        secret.push(rng.gen_range(b'a'..=b'z') as char);
    }

    secret
}
