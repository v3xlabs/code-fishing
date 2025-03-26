CREATE TABLE parties (
    party_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    party_id TEXT NOT NULL REFERENCES parties(party_id),
    event_id SERIAL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (party_id, event_id)
);
