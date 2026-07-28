/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE TYPE user_role AS ENUM ('siswa', 'guru', 'admin');
    CREATE TYPE survey_type AS ENUM ('kepuasan', 'evaluasi_guru', 'evaluasi_kegiatan');
    CREATE TYPE survey_status AS ENUM ('draft', 'published', 'closed');
    CREATE TYPE question_type AS ENUM ('pilihan_ganda', 'skala', 'essay');
  `);

  await knex.schema.raw(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nama TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role user_role NOT NULL,
      kelas TEXT,
      angkatan INT,
      mapel_diampu TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE surveys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      judul TEXT NOT NULL,
      tipe survey_type NOT NULL,
      deskripsi TEXT,
      target_kelas TEXT,
      target_angkatan INT,
      guru_id UUID REFERENCES users(id),
      periode_mulai TIMESTAMPTZ NOT NULL,
      periode_selesai TIMESTAMPTZ NOT NULL,
      status survey_status NOT NULL DEFAULT 'draft',
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      urutan INT NOT NULL,
      teks_pertanyaan TEXT NOT NULL,
      tipe_jawaban question_type NOT NULL,
      opsi JSONB,
      wajib BOOLEAN NOT NULL DEFAULT true
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      siswa_id UUID NOT NULL REFERENCES users(id),
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (survey_id, siswa_id)
    );
  `);

  await knex.schema.raw(`
    CREATE TABLE answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      jawaban_pilihan TEXT,
      jawaban_skala INT CHECK (jawaban_skala BETWEEN 1 AND 5),
      jawaban_teks TEXT
    );
  `);

  await knex.schema.raw(`
    CREATE INDEX idx_questions_survey_id ON questions(survey_id);
    CREATE INDEX idx_responses_survey_id ON responses(survey_id);
    CREATE INDEX idx_answers_response_id ON answers(response_id);
    CREATE INDEX idx_answers_question_id ON answers(question_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.raw(`
    DROP TABLE IF EXISTS answers;
    DROP TABLE IF EXISTS responses;
    DROP TABLE IF EXISTS questions;
    DROP TABLE IF EXISTS surveys;
    DROP TABLE IF EXISTS users;

    DROP TYPE IF EXISTS question_type;
    DROP TYPE IF EXISTS survey_status;
    DROP TYPE IF EXISTS survey_type;
    DROP TYPE IF EXISTS user_role;
  `);
};
