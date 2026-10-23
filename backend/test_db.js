const mongoose = require('mongoose');
const uri = 'mongodb://amaanshaikh7133_db_user:NEW_PASSWORD@ac-irnossx-shard-00-00.zxwx2ih.mongodb.net:27017,ac-irnossx-shard-00-01.zxwx2ih.mongodb.net:27017,ac-irnossx-shard-00-02.zxwx2ih.mongodb.net:27017/campus_ai?ssl=true&authSource=admin&retryWrites=true&w=majority';
mongoose.connect(uri)
  .then(() => { console.log('Connected!'); process.exit(0); })
  .catch(err => { console.error('Error:', err); process.exit(1); });