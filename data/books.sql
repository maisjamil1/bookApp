DROP TABLE IF EXISTS booktable;
CREATE TABLE booktable(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url VARCHAR(255),
    author VARCHAR(255),
    description TEXT,
    isbn VARCHAR(255),
   bookshelf VARCHAR(255)
);
DROP TABLE IF EXISTS authortb;
CREATE TABLE authortb(
    id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    info TEXT,
    booksid VARCHAR(255)
);