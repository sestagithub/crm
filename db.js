var mysql = require('mysql');

const db = mysql.createConnection({
 host     : 'z3iruaadbwo0iyfp.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user     : 'he97ctpf5xhd2dx8',
  password : 'bhzu9o231663mvei',
  database : 'qio7bkfzsnpwdsgd', 
  port:3306,
  
 });



 //  const db = mysql.createConnection({
 //   host     : 'localhost',
 //   user     : 'root',
 //  password : '',
 //  database : 'crm', 
 //  port:3306,
 
 // });




db.connect((err) => {
  if(err){
      throw err;
  }
  console.log('MySql Connected...');
});

module.exports = db;

