const db = require('../config/config');

const onbording = {
    getall: (cb) =>{
        db.query('SELECT * FROM onbording', cb);
    },

    getbyid : (id , cb) =>{
        db.query('SELECT * FROM onbording  WHERE id = ?', [id],cb);
    },

    create:(data , cb)=> {
        const {image , heading , subheading} = data;
        db.query('INSERT INTO onbording (image , heading , subheading) VALUES (?, ?, ?)', [image , heading , subheading], cb);
    },

    update:(id , data , cb) =>{
        const {image , heading , subheading} = data;
        db.query('UPDATE onbording SET image= ? , heading = ? , subheading = ? WHERE id = ?' , [image , heading , subheading , id], cb);
    },

    delete: (id , cb)=>{
        db.query('DELETE FROM onbording  WHERE ID =?', [id] , cb);
    }

}

module.exports = onbording;