CREATE TABLE IF NOT EXISTS university_applications (
                                                       id BIGSERIAL PRIMARY KEY,
                                                       university_name VARCHAR(255) NOT NULL,
    university_code VARCHAR(50) NOT NULL,
    email_domain VARCHAR(100),
    admin_full_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    admin_phone VARCHAR(20),
    admin_role VARCHAR(100),
    message VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(1000),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
    );