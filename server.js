'use strict'
require('dotenv').config();
const express = require('express')
const superagent = require('superagent')
const pg = require('pg')
const methodOverride = require('method-override')


const app = express()
const PORT = process.env.PORT || 3000
const client = new pg.Client(process.env.DATABASE_URL)

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))


app.set('view engin', 'ejs')

//routs_________________________________________
app.get('/', homehandler)
app.get('/searches/new', renderSearchPage)
app.post('/searches', searchHandler)
app.get('/books/:id', showDetailsHandler)
app.post('/books', addBookToDBHandler)
app.post('/updateForm/:id', updateFormHandler)
app.put('/update/:id', updateHandler)
app.delete('/delete/:id', deleteHandler)
app.post('/sort', sortHandler)
app.get('/author/:author', authorDetailsHandler)
app.get('/option', selectBookshelf)/////////////////
app.use('*', pageNotFoundHandler)


//______________________________________
function selectBookshelf(req, res) {
    const SQL = 'SELECT * FROM booktable;'
    client.query(SQL).then(results => {
        let BooksArr = results.rows
        let BooksSHELF =[];
         BooksArr.forEach(val => {
            if(!BooksSHELF.includes(val.bookshelf)){
                BooksSHELF.push(val.bookshelf)
               
            }
        })
        console.log(BooksSHELF);
        res.render('pages/books/option.ejs', { optionss: BooksSHELF })
    })
}
//______________________________________










//_______________________________________________
function homehandler(req, res) {
    const SQL = 'SELECT * FROM booktable;'
    client.query(SQL).then(results => {

        res.render('pages/index.ejs', { data: results.rows })
    })
}

//_______________________________________________
function renderSearchPage(req, res) {
    res.render('pages/searches/new.ejs')
}
//_______________________________________________________
function searchHandler(req, res) {

    const { urText, serchBY } = req.body
    console.log(serchBY);
    superagent.get(`https://www.googleapis.com/books/v1/volumes?q=${urText}+in${serchBY}:${urText}`).then((data) => {

        // console.log(data.body.totalItems);//0

        let check = data.body.totalItems;

        if (check !== 0) {
            const bookArr = data.body.items.map((obj) => {
                return new bookCon(obj.volumeInfo)


            })
            // console.log(bookArr);//✖✔☑
            res.render('pages/searches/show.ejs', { data: bookArr })

        } else {//if i search about:dededeefffff
            res.send('<h3 style="color: brown;">we can not find this book</h3>')
        }
    })
        .catch(err => {
            errorHandler(err, req, res)
        })
}

function bookCon(data) {
    this.title = data.title || 'not found'
    this.image_url = data.imageLinks.smallThumbnail || data.imageLinks.thumbnail || 'https://i.imgur.com/J5LVHEL.jpg.'
    this.author = data.authors[0] || 'not found'
    this.description = data.description || 'not found'
    this.isbn = data.industryIdentifiers[0].type || 'not found'
    this.bookshelf = (data.categories[0]) ? data.categories[0] : '__'

}

//_______________________________________________
function showDetailsHandler(req, res) {
    const book_id = req.params.id;
    const SQL = 'SELECT * FROM booktable WHERE id=$1;'
    const VALUES = [book_id]
    client.query(SQL, VALUES).then((results) => {
        res.render('pages/books/detail.ejs', { val: results.rows[0] })
    })
        .catch(err => {
            errorHandler(err, req, res)
        })
}
//_______________________________________________
function addBookToDBHandler(req, res) {//الافضل اعمل كمان هاندلر بس للسيليكت بدل ما اخبصهم هيك
    const { title, image_url, author, description, isbn, bookshelf } = req.body;
    const checkSQL = 'SELECT * FROM booktable WHERE title=$1 AND image_url=$2 AND author=$3 AND description=$4 AND isbn=$5 AND bookshelf=$6 ;'
    const VALUES = [title, image_url, author, description, isbn, bookshelf]
    const SQL = 'INSERT INTO booktable(title,image_url,author,description,isbn,bookshelf)VALUES($1,$2,$3,$4,$5,$6);'
    client.query(checkSQL, VALUES).then((checkResults) => {

        if (checkResults.rows.length === 0) {
            client.query(SQL, VALUES).then(() => {
                const sql = 'SELECT * FROM booktable WHERE title=$1 AND image_url=$2 AND author=$3 AND description=$4 AND isbn=$5 AND bookshelf=$6 ;'
                const values = [title, image_url, author, description, isbn, bookshelf]
                client.query(sql, values).then((results) => {
                    // console.log(results.rows[0].id);//✔
                    res.redirect(`/books/${results.rows[0].id}`)
                })
            })
        } else {
            res.redirect(`/books/${checkResults.rows[0].id}`)
            // res.redirect('/')
        }


    })
        .catch(err => {
            errorHandler(err, req, res)
        })

}
//_______________________________________________
function updateFormHandler(req, res) {
    let id = req.params.id
    const SQL = 'SELECT * FROM booktable WHERE id=$1;'
    const VALUES = [id]
    client.query(SQL, VALUES).then((results) => {
        
        res.render('pages/books/edit.ejs', { val: results.rows[0] })
    })
        .catch(err => {
            errorHandler(err, req, res)
        })

}
//_______________________________________________
function updateHandler(req, res) {
    const { title, image_url, author, description, isbn, bookshelf } = req.body;
    const SQL = 'UPDATE booktable SET title=$1, image_url=$2, author=$3, description=$4, isbn=$5, bookshelf=$6 WHERE id=$7;'
    const VALUES = [title, image_url, author, description, isbn, bookshelf, req.params.id]
    client.query(SQL, VALUES).then((results) => {

        res.redirect(`/books/${req.params.id}`)
    })
        .catch(err => {
            errorHandler(err, req, res)
        })
}

//_______________________________________________
function deleteHandler(req, res) {
    const SQL = 'DELETE FROM booktable WHERE id=$1;'
    const VALUES = [req.params.id]
    client.query(SQL, VALUES).then((results) => {

        res.redirect('/')
    })
        .catch(err => {
            errorHandler(err, req, res)
        })
}
//_______________________________________________
function sortHandler(req, res) {
    let sortBY = req.body.sort
    // console.log(sortBY);
    const SQL = 'SELECT * FROM booktable;'
    client.query(SQL).then(results => {
        let homeArr = results.rows
        homeArr.sort((a, b) => {
            let firtItem = a[sortBY]
            let secondItem = b[sortBY]
            firtItem = firtItem.toUpperCase()
            secondItem = secondItem.toUpperCase()

            if (firtItem > secondItem) {
                return 1;
            } else if (firtItem < secondItem) {
                return -1;
            } else {
                return 0;
            }
        })


        res.render('pages/index.ejs', { data: homeArr })

    })
}

//_______________________________________________
function authorDetailsHandler(req, res) {
    const getAuthorBooks = 'SELECT * FROM booktable WHERE author=$1;'
    const authorName = [req.params.author]
    client.query(getAuthorBooks, authorName).then(results => {
        // console.log(results.rows);
        let AuthorBooksArr = results.rows

        let idAuthorBooks = AuthorBooksArr.map(val => {
            return val.id
        })
        let nameOfBooks = AuthorBooksArr.map(val => {
            return val.title
        })
        // console.log(idAuthorBooks);
        // console.log(nameOfBooks);
        const authorSQL = 'INSERT INTO authortb(author,info,booksid)VALUES($1,$2,$3);'
        const authorVALUES = [req.params.author, nameOfBooks, idAuthorBooks]
        client.query(authorSQL, authorVALUES).then(results => {


            const SQL = 'SELECT * FROM authortb WHERE author=$1;'
            const VALUES = [req.params.author]
            client.query(SQL, VALUES).then(results => {
                // console.log(results.rows[0]);

                res.render('pages/books/authorDetails.ejs', { val: results.rows[0] })
            })

        })



    })
}




//_____________________________________________________________

function errorHandler(err, req, res) {
    res.render('pages/error.ejs', { error: err })
}
function pageNotFoundHandler(req, res) {
    res.status(404).send('✖ page not found ✖')
}



app.get('/test', test)
function test(req, res) {
    res.send('hello mais')
}

//_____________________________________________________________
client.on('error', (err) => console.log(err));
client.connect().then(() => {
    app.listen(PORT, () => console.log('up and running', PORT))
})
