import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: 'localhost',
    port:3306,
    user: 'root',
    password: 'mapyeugau110418',
    database: 'nodeexpress'
});

connection.connect(function (err, connection){
    if(err) throw err;
    console.log("Connected to the database");
})

export default connection;
