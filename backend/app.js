/* 1. expressモジュールをロードし、インスタンス化してappに代入。*/
var express = require("express");
var mysql = require('mysql');
var app = express();
var port = 3000;
require('dotenv').config();                         //環境変数を process.env にセットする命令
const jwt = require('jsonwebtoken');

// `.bashrc` で設定した環境変数からユーザー情報を取得
const USERNAME = process.env.KANO_USER || "Guest";
const PASSWORD = process.env.KANO_PASSWORD || "NoPass";
const SECRET_KEY = process.env.KANO_SECRET_KEY || "NoKey";

/* 2. listen()メソッドを実行して3000番ポートで待ち受け。*/
var server = app.listen(port, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});

// CORSを許可する
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// その他（ログイン）
const bodyParser = require('body-parser'); // ✅ body-parserを読み込み
app.use(express.json()); // JSONリクエストを解析
app.use(express.urlencoded({ extended: true })); // フォームデータを解析

// **認証ミドルウェア**
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
      return res.status(401).json({ message: "有効期限切れ。再ログインしてください" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.status(403).json({ message: "トークンが無効です" });
      req.user = user;            // 正しくログインできていれば、ユーザ名と一緒に次へ進む
      next();
  });
};

/* 3. 以後、アプリケーション固有の処理 */

// 写真のサンプルデータ
var photoList = [
    {
        id: "001",
        name: "cdome180px.png",
        type: "jpg",
        dataUrl: "http://localhost:3000/img/cdome180px.png"
    },{
        id: "002",
        name: "cdome340px.png",
        type: "jpg",
        dataUrl: "http://localhost:3000/img/cdome340px.png"
    }
]

// 写真リストを取得するAPI
app.get("/list", function(req, res, next){
    res.json(photoList);
});

// ルートAPI
app.get('/', (req, res) => {
    res.send('OK. Razpi00 (^_^)/');
});

app.get('/test',(req, res) => {
    let t = 1 + 2;
    res.send('計算結果は' + ( t+2 ) + 'です');
});

app.get('/rand', (req, res) => {
    let text = ['ねこ','いぬ','インコ'];
    let index = Math.floor( Math.random() * 3 );
    res.send( '今日の運勢は' + text[ index ] );
});


// ------------------------------------
// データベースに接続する関数（=function）
// ------------------------------------
function connectDatabase() {
  // MySQLデータベースの接続情報を設定
  const db = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'raspberry',
      database: 'mysql'
  });

  // データベースに接続
  db.connect((err) => {
      if (err) {
        throw err;
      }
      console.log('MySQL接続は成功');
  });

  return db;
}

// ------------------------------------
// データベースを閉じる関数
// ------------------------------------
function closeDatabase(db) {
  // データベース接続を閉じる
  db.end((err) => {
    if (err) {
      console.error('DB接続を閉じるときにエラー:', err);
    } else {
      console.log('MySQLデータベース接続をクローズできました.');
    }
  });
}


// ------------------------------------
// データ読み込み
// ------------------------------------
app.get('/get', authenticateToken, (req, res) => {
  //　１．データベースに接続
  const db = connectDatabase(); 
  //　２．データを読み出すクエリ
  let sql = 'SELECT * FROM todo where flag<>"true"';
  db.query(sql, (err, results) => {
      if (err) {
        console.log('読み出しに失敗');
        throw err;
      }
      console.log('読み出しに成功');
      res.json(results);
  });
  //　３．データベースを閉じる
  closeDatabase(db); 
});

// ------------------------------------
// 完了したデータのみ読み込み
// ------------------------------------
app.get('/complete', authenticateToken, (req, res) => {
  //　１．データベースに接続
  const db = connectDatabase(); 
  //　２．データを読み出すクエリ
  let sql = 'SELECT * FROM todo where flag="true"';
  db.query(sql, (err, results) => {
      if (err) {
        console.log('読み出しに失敗');
        throw err;
      }
      console.log('読み出しに成功');
      res.json(results);
  });
  //　３．データベースを閉じる
  closeDatabase(db); 
});

// ------------------------------------
// データ書き込み
// ------------------------------------
app.post('/create', authenticateToken, (req, res) => {
  //　１．データベースに接続
  const db = connectDatabase(); 

  //　２．データを書き込むクエリ
  let myFlag = req.body.flag;
  let myPlan = req.body.plan;
  let myResult = req.body.result;
  sql = "INSERT INTO todo (flag, plan, result) VALUES ('" 
    + myFlag + "', '" 
    + myPlan + "', '" 
    + myResult + "');";
  db.query(sql, (err, results) => {
    if (err) {
      console.log('データベース書き込みに失敗 INSERT for API /put in app.js');
      throw err;
    }
    res.json(results);
    console.log('DBに書き込み成功しました 🎉 INSERT for API /put in app.js');
  });

  //　３．データベースを閉じる
  closeDatabase(db); 
});

// ------------------------------------
// データ削除
// ------------------------------------
app.delete('/delete/:id', authenticateToken, (req, res) => {
  //　１．データベースに接続
  const db = connectDatabase();
  //　２．URLパラメータから `id` を取得（修正: `req.params.id` を使用）
  let myID = req.params.id;
  // IDが空ならエラーを返す
  if (!myID) {
    return res.status(400).json({ message: "削除するIDが指定されていません。" });
  }
  // SQLクエリを安全に実行（修正: プレースホルダーを使用してSQLインジェクションを防ぐ）
  let sql = "DELETE FROM todo WHERE id = ?";
  db.query(sql, [myID], (err, results) => {
    if (err) {
      console.error("DBのレコード削除に失敗:", err);
      return res.status(500).json({ message: "データベースエラー" });
    }
    res.json({ message: `ID[${myID}] を削除しました 🎉`, data: results });
    console.log(`DBのID[${myID}] を削除成功 🎉`);
  });

  //　３．データベースを閉じる
  closeDatabase(db);
});

// ------------------------------------
// データ更新
// ------------------------------------
app.put('/update/:id', authenticateToken, (req, res) => {
  // １．データベースに接続
  const db = connectDatabase();
  // ２．URLパラメータから `id` を取得（修正: `req.params.id` を使用）
  let myID = req.params.id;
  // `body` から更新データを取得（修正: `req.body` を使用）
  let myFlag = req.body.flag;
  let myPlan = req.body.plan;
  let myResult = req.body.result;
  // IDが空ならエラーを返す
  console.log('[1]更新するID', myID);
  if (!myID || myFlag === undefined || !myPlan || !myResult) {
    return res.status(400).json({ message: "更新するIDまたはデータが不足しています。" });
  }
  console.log("★更新するデータ:", { myID, myFlag, myPlan, myResult }); // デバッグ用ログ
  // SQLクエリを安全に実行（修正: プレースホルダーを使用）
  let sql = "UPDATE todo SET flag = ?, plan = ?, result = ? WHERE id = ?";
  db.query(sql, [myFlag, myPlan, myResult, myID], (err, results) => {
    if (err) {
      console.error("レコードの更新に失敗:", err);
      return res.status(500).json({ message: "データベースエラー" });
    }
    res.json({ message: `ID[${myID}] のデータを更新しました 🎉`, data: results });
  });
  closeDatabase(db);  // ３．データベースを閉じる
});


app.get('/put/:myResult', (req, res) => {
  // MySQLデータベースの接続情報を設定
  const db = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'raspberry',
      database: 'mysql'
  });

  // データベースに接続
  db.connect((err) => {
      if (err) {
        throw err;
      }
      console.log('MySQL接続は成功');
  });

  // データを読み出すクエリ
  let sql = 'use mysql';
  db.query(sql, (err, results) => {
    if (err) {
      throw err;
    }
  });
  
  // データを書き込むクエリ
  sql = "insert into todo (userid, plan, result) values (5, '" + req.params.myResult + "', 'API入力');";
  db.query(sql, (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
    console.error('DBに書き込み成功しました 🎉', err);
  });

  // データベース接続を閉じる
  db.end((err) => {
      if (err) {
        console.error('DB接続を閉じるときにエラー:', err);
      } else {
        console.log('MySQLデータベース接続をクローズできました.');
      }
  });

});

// 文字表示アプリ
app.get('/print/:name', (req, res) => {
  res.send( "あなたは " + req.params.name + " を入力しました");
});


// **ログインAPI**　htmlかURLオプションから取り出す
app.post('/login', (req, res) => {
  console.log('ログイン認証チェックします・・・', req.body);
  const { username, password } = req.body;
  //デバッグ　res.send(`ユーザー名: ${username}, パスワード: ${password}`);
  //デバッグ　res.send(`ユーザー名: ${USERNAME}, パスワード: ${PASSWORD}`);
  //デバッグ　res.send(`キー: ${SECRET_KEY}`);

  if (username === USERNAME && password === PASSWORD) {
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
      return res.json({ token });
  } else {
    res.status(401).json({ message: "IDとパスワードが違います" });
  }
});


