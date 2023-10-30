const express = require('express');
const path = require('path');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
// Create an instance of the Express application
const app = express();

// Define a port for your server to listen on
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Create a connection pool
const pool = mysql.createPool({
    host: 'consultas.snte50.com.mx',
    user: 'sistemasm',
    password: 'tejano56384',
    database: 'emprendete'
});

// Handle database connection errors
pool.on('error', (err) => {
    console.error('Error connecting to the database:', err);
});



//Login 
app.get('/api/tipo_registro/:param1', (req, res) => {
    const param1 = req.params.param1;
    console.log(param1);
    console.log("SELECT id as id_group,universidad,token AS token,asistentes,grupal,individual FROM GRUPOS WHERE token='1'")
    pool.query("SELECT id as id_group,universidad,token AS token,asistentes,grupal,individual FROM GRUPOS WHERE token='" + param1+"'", (err, results) => {
            if (err) {
                console.log("EERRRR",error)
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            console.log(results);
                    res.json(results);
            /* if (results.length > 0) {
                console.log(results);

                res.json(results);
                // You can return true here or perform additional actions
            } else {
                res.json(results);
                // You can return false here or perform additional actions
            } */
        });

});



//Login 
app.get('/api/login/:param1/:param2', (req, res) => {
    const param1 = req.params.param1;
    const param2 = req.params.param2;

    pool.query("SELECT a.id AS id_group,a.token AS token,a.asistentes,a.grupal,a.individual,(SELECT COUNT(*) FROM registro WHERE id_grupo=a.id AND borrado=0) AS registrados FROM GRUPOS as a WHERE token='" + param1 + "' AND password='" + param2+"'" , (err, results) => {

            if (err) {
                console.error('Error executing the query:', err);
                // res.status(500).json({ error: 'Internal Server Error' });
                //return;
                return res.status(500).json({ error: 'Internal Server Error' });

            }
            //        res.json(results);
            if (results.length > 0) {
                console.log(results);

                res.json(results);
                // You can return true here or perform additional actions
            } else {
                res.json(results);
                // You can return false here or perform additional actions
            }
        });

});



//LoginFeria
app.get('/api/loginFeria', (req, res) => {
    pool.query("SELECT a.id AS id_group,a.token AS token,a.asistentes,a.grupal,a.individual,(SELECT COUNT(*) FROM registro WHERE id_grupo=a.id AND borrado=0) AS registrados FROM GRUPOS as a WHERE feria=1" , (err, results) => {

            if (err) {
                console.error('Error executing the query:', err);
                return res.status(500).json({ error: 'Internal Server Error' });

            }
            if (results.length > 0) {
                res.json(results);
                // You can return true here or perform additional actions
            } else {
                res.json(results);
                // You can return false here or perform additional actions
            }
        });
});


//SELECT CLIENTE X ID
app.get('/api/registro/:id', (req, res) => {
    // Use the connection pool to execute a query
    const param1 = req.params.id;
    pool.query('SELECT * FROM registro where borrado=0 and id_grupo=' + param1, (err, results) => {
        if (err) {
            console.error('Error executing the query:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.json(results);
    });
});

//SELECT CLIENTE X ID
app.get('/api/data_congresos', (req, res) => {
    // Use the connection pool to execute a query
    pool.query('SELECT nombre FROM congresos order by nombre asc', (err, results) => {
        if (err) {
            console.error('Error executing the query:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        console.log(results)
        res.json(results);
    });
});

// Define the API endpoint to insert data
app.post('/api/insertData', (req, res) => {
    const data = req.body[0];
    // Perform the database insertion
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        const query = 'INSERT INTO registro (id_grupo, nombre, correo, telefono, congreso,ref) VALUES (?, ?, ?, ?, ?,?) ';
        const values = [data.id_grupo, data.nombre, data.correo, data.telefono, data.congreso, data.ref];

        connection.query(query, values, (error) => {
            connection.release(); // Release the connection

            if (error) {
                console.error('Error inserting data:', error);
                res.status(500).json({ error: 'Database error' });
                return;
            }
            
            const selectQuery = 'SELECT * FROM registro WHERE correo = ? ORDER BY CREAFEC DESC LIMIT 1';
            connection.query(selectQuery, [data.correo], (selectError, selectResult) => {
                if (selectError) {
                    console.error('Error fetching newly created data:', selectError);
                    res.status(500).json({ error: 'Database error' });
                    return;
                }
        
                const insertedData = selectResult[0]; // Assuming there's only one result
        
                res.status(200).json({ message: 'Data inserted successfully', insertedData });
            });


        });
    });
});


// Define the modified API endpoint to insert multiple records
app.post('/api/registro/insertMultipleData', (req, res) => {
    const records = req.body.records;

    if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
        return;
    }

    // Perform the database insert for each record in the array
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const query = 'INSERT INTO registro (id_grupo, nombre, correo, telefono, congreso, borrado) VALUES (?, ?, ?, ?, ?, ?)';

        // An array to store the values for batch insertion
        const batchValues = [];

        records.forEach((record) => {
            const { id_grupo, nombre, correo, telefono, congreso, borrado } = record;
            const values = [id_grupo, nombre, correo, telefono, congreso, borrado];
            batchValues.push(values);
        });

        connection.query(query, batchValues, (error) => {
            connection.release(); // Release the connection

            if (error) {
                console.error('Error inserting data:', error);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            res.status(200).json({ message: 'Data inserted successfully' });
        });
    });
});

//Borra asistente
app.put('/api/deleteData', async (req, res) => {
    try {
        const model = req.body[0];
        const query = `UPDATE registro SET borrado = 1 WHERE id =  ?`;
        return pool.query(query, [model.id], (error, results) => {
            if (error) {
                res.status(500).json({ error: 'An error occurred while updating the entity' });
            } else {
                console.log(results);
                res.status(200).json({ message: 'Entity updated successfully with ID' + results.insertId });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating the entity' });
    }
});

//Actualiza asistente
app.put('/api/updateData', async (req, res) => {
    console.log("ENTRA A UPDATEDATAAAA")
    const model = req.body[0];

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }


        const query = 'UPDATE registro SET nombre=?, correo=?, telefono=?, congreso=? WHERE id=?';
        const values = [model.nombre, model.correo, model.telefono, model.congreso, model.id];


        connection.query(query, values, (error) => {
            connection.release(); // Release the connection

            if (error) {
                console.error('Error inserting data:', error);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            res.status(200).json({ message: 'Data inserted successfully' });
        });
    });
});

// Define a route for handling API requests (replace with your API logic)
app.get('/api/test', (req, res) => {
    // Replace this with your actual API logic
    const data = { message: 'Hello from the server!' };
    res.json(data);
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});