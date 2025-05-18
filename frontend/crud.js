// -------------------------------
// 初期設定
// -------------------------------
//let server = "http://192.168.1.5:3000";
let server = "http://razpi00.local:3000";
const token = localStorage.getItem("authToken");// ローカルストレージからログイン認証トークンを取得

// -------------------------------
// HTMLを全て読み込んだ後で、自動実行するスクリプト
// -------------------------------
window.onload = function start() {
    document.getElementById('server').innerHTML = '<p>' + server + '</p>';
    if (!token) {
        document.getElementById("token").innerHTML = "<div class='d-flex justify-content-end'><i class='bi bi-person-x-fill'></i><a href='login.html'>ログイン</a></div>";
    } else {
        document.getElementById("token").innerHTML = "<div class='d-flex justify-content-end'><i class='bi bi-person-badge'></i></div>";
    }
}

// ----------------------------------------------
// データベースからデータを読み込む。
// 読み込んだ結果をHTMLの <div id='output'></div> の場所に表示する
// ----------------------------------------------
async function getName(viewType) {
    // ログイン済みか否か検証
    if (!token) {
        document.getElementById("output").innerHTML = `<p>ログインしてください</p>`;
        return;
    }

    // 「未完了」と「完了済み」のどちらを表示するのか切り替える
    let url;
    if (viewType === "uncomplete") {
        url = server + "/get";       // 未完了　リストを表示
    } else {
        url = server + "/complete";  // 完了済みリストを表示
    }

    // データ読み込みAPIを実行
    try {
        const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`(getName) APIエラー: ${response.status} ${response.statusText}`);
        }

        const jsonObj = await response.json();
        let html = '<table class="table table-bordered"><tr><th>ID</th><th>完了</th><th>やること</th><th>実績</th><th>編集</th></tr>';

        jsonObj.forEach(item => {
            const strFlag = item.flag === "true" ? "<i class='bi bi-check-square-fill'></i>" : "";
            html += `<tr><td>${item.id}</td><td style="text-align:center;">${strFlag}</td><td>${item.plan}</td><td>${item.result}</td><td>`
                + `<button onclick="window.location.href='edit.html?id=${item.id}&flag=${item.flag}&plan=${item.plan}&result=${item.result}';" class="btn btn-secondary">...</button>`
                + `${item.id}</td></tr>`;
        });

        html += "</table>";
        document.getElementById("output").innerHTML = html;

    } catch (error) {
        document.getElementById("output").innerHTML = `<p>エラーが発生しました: ${error.message}</p>`;
        console.error("(getName) Error:", error);
    }
}


// ----------------------------------------------
// データベースにデータを書き込む
// ----------------------------------------------
async function putName() {
    // 完了フラグはfalseをセットする
    var plan = document.getElementById('inputPlan').value;
    var result = document.getElementById('inputResult').value;
    if (plan == '') {
        document.getElementById('output').innerHTML = '<p>名前とデータが不足しています<i class="fa-solid fa-pen"></i></p>';
        return;
    }
    try {
        document.getElementById('output').innerHTML = '<p>書き込みしています</p><i class="fa fa-cog fa-spin fa-3x fa-fw"></i>';
        const url = `${server}/create`;
        const response = await fetch(url, {
            method: "POST",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"        
            },
            body: JSON.stringify({
                flag: false,
                plan: plan,
                result: result
            })        
        });
        if (!response.ok) {
            throw new Error('(putName) APIサーバーに届きません。ネットワークの応答が正しくありません');
        }
        let html = "やること［" + plan + "］と実績［" + result + "］を書き込みました";
        document.getElementById('output').innerHTML = html;
    }  catch (error) {
        document.getElementById('output').innerHTML = '<p>エラーが発生しました<br />' + error +'</p>';
        console.error('(putName) Error:', error);
    }
}

// ----------------------------------------------
// データを削除する
// ----------------------------------------------
async function deleteName() {
    var targetID = document.getElementById('inputMyID').value;
    if (targetID === '') {
        document.getElementById('output').innerHTML = '<p>削除するIDが不足しています<i class="fa-solid fa-pen"></i></p>';
        return;
    }
    try {
        document.getElementById('output').innerHTML = '<p>削除しています</p><i class="fa fa-cog fa-spin fa-3x fa-fw"></i>';
        const url = `${server}/delete/${targetID}`; //  IDをURLのパスに含める
        const response = await fetch(url, {
            method: "DELETE",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`(deleteName) APIサーバーに届きません。ステータス: ${response.status} ${response.statusText}`);
        }
        let html = `ID［${targetID}］を削除しました`;
        document.getElementById('output').innerHTML = html;
    } catch (error) {
        document.getElementById('output').innerHTML = `<p>エラーが発生しました<br />${error}</p>`;
        console.error('(deleteName) Error:', error);
    }
}

// ----------------------------------------------
// データベースを更新する
// ----------------------------------------------
async function updateName() {
    var myID = document.getElementById('inputMyID').value;
    var flag = document.getElementById('inputFlag').checked;
    var plan = document.getElementById('inputPlan').value;
    var result = document.getElementById('inputResult').value;
    if (!myID) {
        document.getElementById('output').innerHTML = '<p>更新するIDが不足しています<i class="fa-solid fa-pen"></i></p>';
        return;
    }
    try {
        document.getElementById('output').innerHTML = '<p>データを変更しています<i class="fa fa-cog fa-spin fa-3x fa-fw"></i></p>';
        const url = `${server}/update/${myID}`; // IDをURLパスに含める
        const response = await fetch(url, {
            method: "PUT",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                flag: flag,
                plan: plan,
                result: result
            })
        });
        if (!response.ok) {
            throw new Error(`(updateName) APIサーバーに届きません。ステータス: ${response.status} ${response.statusText}`);
        }
        let html = `やること［${plan}］と実績［${result}］を更新しました`;
        document.getElementById('output').innerHTML = html;
    } catch (error) {
        document.getElementById('output').innerHTML = `<p>エラーが発生しました<br />${error}</p>`;
        console.error('(updateName) Error:', error);
    }
}