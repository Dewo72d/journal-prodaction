const db = require("../database/database");
const jwt = require("jsonwebtoken");
const {jwtSecret} = require("../config/authConfig");
// Эта функция для проверки типов ну или чего либо.
//Принимает только функции.
//Если условие TRUE выполняется колбек doOnTrue, иначе doOnFalse
function validator(checkFun, doOnTrue, doOnFalse) {
    if (typeof checkFun != "function" || typeof doOnTrue != "function" || typeof doOnFalse != "function") throw new Error("not a function");
    if (checkFun()) {
        return doOnTrue();
    } else {
        return doOnFalse();
    }
}

//-------Проверка JWT------------
/*
 * Врезультате выполнения этого метода
 * на фронте будет возвращатся страница
 * равная роли и группе
 */
exports.testCookie = (req, res) => {
    console.log(req.cookies.auth,"23<<<<<<<<<");
    jwt.verify(req.cookies.auth, Object.values(jwtSecret)[0], (err, decode) => {
        console.log(err,"<<<<<<<<<25");
        res.set("Access-Control-Allow-Origin", req.headers.origin); //<<КОСТЫЛЬ!? << ООооХ, эти 2 строки что бы можно было отправлять статус коды.
        res.set("Access-Control-Allow-Credentials", "true");        //<<КОСТЫЛЬ!? << Без них  CORS начитает ругатся, хотя он и без этого рукается.
        if (err || typeof decode === "undefined") return res.status(401).json(`${new Error("Помилка токену")}`);
        let {group, role} = jwt.decode(req.cookies.auth);
        console.log(group, role);
        return res.status(200).json({group: group, role});
    });
};
//Вход на сайт
exports.login = (req, res) => {
    
    const {login, password, role} = req.body;
    if (!login || !password) return res.status(401).json(`${new Error("Невірний  логін або пароль")}`);

    db.connection.query(`SELECT * FROM ${role} WHERE login = '${login}'`, (err, result) => {
        console.log(err, result);
        if (err) return res.status(401).json(`${new Error("Невірний  логін або пароль")}`);
        let group = result.length === 0 ? () => {
            return res.status(401).json(`${new Error("Невірний  логін або пароль")}`);
        } : typeof result[0].starostaGroup === "undefined" ? typeof result[0].prepodGroup === "undefined" ? 0 : result[0].prepodGroup : result[0].starostaGroup;
        console.log(result,err,"<<<<<<<<<46");
        if (result.length === 0) {
            res.status(401).json(
                `${new Error("Невірний  логін або пароль")}`
            );
        } else {
            const hash = (password === result[0].password); // Сравниваем пароли
            if (hash) {
                jwt.sign(
                    {
                        name: result[0].fullName,
                        role: role,
                        group: group
                    },
                    Object.values(jwtSecret)[0],
                    {
                        expiresIn: 60 * 5,
                    },
                    (err, token) => {
                        if (err) throw new Error(err);
                        res.cookie("auth", `${token}`, {httpOnly: true});
                        res.redirect("http://45.141.79.25:3000/");// БЕЗ ЭТОГО КУКА НЕ ОТПРАВЛЯЕТСЯ
                    });
            } else {
                return res.status(401).json(
                    `${new Error("Невірний  логін або пароль")}`
                );
            }


        }
    });
};


//----------НУЖЕН РЕФАКТОРИНГ-----НУЖЕН РЕФАКТОРИНГ-----НУЖЕН РЕФАКТОРИНГ----------

//Добавление нового: админа,  препорда
exports.addNewUser = (req, res) => {
    const {fullName, login, password, role} = req.body;


    db.connection.query(`SELECT * FROM ${role} WHERE login = ${login}`, (err, result) => {
        if (result.length > 0) {
            return (
                res.status(401).json(
                    `${new Error("Такий логін вже існує")}`
                )
            );
        } else {
            db.connection.query(`INSERT INTO ${role} (fullName,login, password) VALUES(${fullName}, ${login}, ${password})`);
            /*???????????????????????????*/
        }
    });
};

//Выборка в админке
exports.selection = (req, res) => {
    let date = validator(() => req.body.month === "true", () => `MONTH(lesson.Date) = MONTH('${req.body.date}')`, () => `lesson.Date = STR_TO_DATE('${req.body.date}', '%Y-%m-%d')`);
    let name = validator(() => req.body.name === "", () => "", () => `AND students.fullName LIKE '%${req.body.name}%'`);
    let group = validator(() => req.body.group === "", () => "", () => `AND students.studentGroup = ${req.body.group}`);
    let lesson = validator(() => req.body.lesson === "0", () => "", () => `AND lesson.lessonNumber = ${req.body.lesson}`);
    let countA = 0;
    let countP = 0;
    //------------------------------
    let sqlQuery = `SELECT students.fullName,students.studentGroup,lesson.lessonNumber,lesson.Date ,lesson.value FROM lesson,students WHERE ${date} AND lesson.studentId = students.id ${lesson} ${group} ${name} `;
    db.connection.query(sqlQuery, (err, result) => {
        if (err) return res.status(401).json(`${new Error("Помилка БД")}`);
        // Счеткик присутствующих и отствующих
        for (let i = 0; i < result.length; i++) {
            if (result[i].value === "absent") {
                countA += 1;
            } else if (result[i].value === "present") {
                countP += 1;
            }
        }
        result.push({
            countAbsent: countA,
            countPresent: countP
        });
        //--Последний елемент в масиве всегда будет  объектом с ключами: countAbsent ,countPresent --
        res.send(result);
    });
};
//Вивід студентів 
exports.students = (req, res) => {
    console.log(typeof req.cookies.auth, req.cookies.auth, 132);
    if(typeof req.cookies.auth === "undefined") return res.status(500).json({message: "Помилка"});
    jwt.verify(req.cookies.auth, jwtSecret, (err, decode) => {
        console.log(decode, err);
        res.set("Access-Control-Allow-Origin", req.headers.origin); //<<КОСТЫЛЬ!? << ООооХ, эти 2 строки что бы можно было отправлять статус коды.
        res.set("Access-Control-Allow-Credentials", "true");        //<<КОСТЫЛЬ!? << Без них  CORS начитает ругатся, хотя он и без этого рукается.
        let {group} = jwt.decode(req.cookies.auth);
        let sql = `SELECT * FROM students WHERE studentGroup = '${group}'`;
        db.connection.query(sql, (err, result) => {
            if (err) res.status(500).json({
                message: "Помилка"
            });
            console.log(result);
            res.send(result);
        });
    });
};
exports.student = (req, res) => {
    const lesson = req.body.lesson;
    let countA = 0;
    let countP = 0;
    let sqlQuery = `SELECT students.fullName,students.studentGroup,lesson.lessonNumber,lesson.Date ,lesson.value FROM lesson,students WHERE lesson.Date =  '${new Date().toISOString().slice(0, 10)}' AND lesson.studentId = students.id AND lesson.lessonNumber = '${lesson}'`;
    db.connection.query(sqlQuery, (error, result) => {
        if (error) console.log(error);
        for (let i = 0; i < result.length; i++) {
            if (result[i].value === "absent") {
                countA += 1;
            } else if (result[i].value === "present") {
                countP += 1;
            }
        }
        result.push({
            countAbsent: countA,
            countPresent: countP
        });
        //--Последний елемент в масиве всегда будет  объектом с ключами: countAbsent ,countPresent --
        res.send(result);
    });
};
//Відмітка
exports.marking = (req, res) => {
    const values = JSON.parse(req.body.students);
    const students = values.slice(0, -2);
    const data = values.slice(-2);
    const today = new Date().toISOString().slice(0, 10);

    let queryValues = `INSERT INTO lesson (value, studentId,lessonNumber,Date) VALUES `;
    for (let i in students) {
        //Генерация запроса
        queryValues += `('${Object.values(students[i])}', ${Object.keys(students[i])},${Object.values(data[0])},"${today}"),`;
    }
    db.connection.query(queryValues.slice(0, -1), (err, result) => {
        if (err) return res.status(500).json({
            message: `Помилка - Ви вже відправляли відміткі`,
        });
        return res.status(200).json({
            message: "Успішно!",
        });
    });
};

exports.updateMarking = (req, res) => {
    const values = JSON.parse(req.body.students);
    const today = new Date().toISOString().slice(0, 10);
    console.log(`UPDATE lesson SET lessonNumber=${values[0].lessonUpdate}, value='${values[2].mark}' WHERE studentId=${values[1].student} AND DATE(Date) = STR_TO_DATE('${today}','%Y-%m-%d')`)
    db.connection.query(`UPDATE lesson SET value='${values[2].mark}' WHERE studentId=${values[1].student} AND DATE(Date) = STR_TO_DATE('${today}','%Y-%m-%d') AND lessonNumber=${values[0].lessonUpdate}`, (err, result) => {
        if (err) return res.status(500).json({
            message: `Помилка`,
        });
        return res.status(200).json({
            message: "Успішно!",
        });
    });
};

//Добавление новго студента в админке
exports.insertingStudent = (req, res) => {
    const name = req.body.name;
    const group = req.body.group;
    let q = `INSERT INTO students (studentGroup,fullName) VALUES ('${group}','${name}')`;//шукаємо в БД чи є такий студент
    if (name === '' || group === '') {
        res.status(200).json({
            message: "Ви не ввели студента чи групу"
        });
    } else {
        let selectName = `SELECT * FROM students WHERE studentGroup = '${group}' AND fullName = '${name}'`;//шукаємо в БД чи є такий студент
        db.connection.query(selectName, (err, result) => {
            if (result.length > 0)
                res.status(200).json({
                    message: "Такий студент вже існує"
                });
            else {
                db.connection.query(q, (error, result2) => {//добавляємо в БД на основі вибірки
                    if (error) res.status(401).json({
                        message: `Помилка - ${result2}`,
                    });
                    res.status(200).json({
                        message: "Студента було додано",
                    });
                });
            }
        });
    }
};

//Перевод студентов на новый курс в админке
exports.uppdateStudent = (req, res) => {
    let updateGroup = `UPDATE students SET students.studentGroup = students.studentGroup + 100 WHERE (students.studentGroup + 100) < 500`;
    let selectGroup = `SELECT * FROM students WHERE (studentGroup + 100) > 500`;
    let deleteStudentGroup = `DELETE FROM students WHERE (students.studentGroup + 100) > 500`;
    db.connection.query(selectGroup, (err, result) => {//шукаємо випускників
        if (result.length > 0) {
            db.connection.query(deleteStudentGroup, (err2, result2) => {//видаляємо їх
                if (err2) {
                    console.log(err2);
                    res.status(500).json({
                        message: `Помилка - ${result2}`
                    });
                } else {
                    db.connection.query(updateGroup, (err3, result3) => {//переводимо інших на наступний курс
                        if (err) res.status(500).json({
                            message: `Помилка - ${err3}, \n ${result3}`
                        });
                        else {
                            res.status(200).json({
                                message: "Переведення успішно здійснено"
                            });
                        }
                    });
                }
            });
        }
    });
};

//Удаление препода
exports.deletePrepod = (req, res) => {
    const {name, group} = req.body;

    if (name.length === 0 || group.length === 0) return res.status(200).json({message: "Ви не ввели викладача чи групу",});
    db.connection.query(`SELECT * FROM prepod WHERE prepodGroup = ${group}`, (err, result) => {
        if (err) return res.status(500).json({message: "Ошибка БД"});
        if (Object.keys(result).length > 0) {
            db.connection.query(`DELETE FROM prepod WHERE prepodGroup = ${group}`, (err, result) => {
                if (err) return res.status(500).json({message: "Ошибка БД"});
                res.status(200).json({message: "Викладача було видалено"});
            });
        } else {
            return res.status(200).json({message: "Викладача або групи не існує"});
        }
    });
};

// Удаление студента
exports.deletingStudent = (req, res) => {
    const {name, group} = req.body;

    if (name.length === 0 || group.length === 0) {
        return res.status(200).json({
            message: "Ви не ввели студента чи групу",
        });
    } else {
        let selectName = `SELECT * FROM students WHERE studentGroup = '${group}' AND fullName = '${name}'`;//шукаємо в БД чи є такий студент
        db.connection.query(selectName, (err, result) => {
            if (result.length === 0) {
                return res.status(200).json({
                    message: "Такого студента немає",
                });
            } else {
                let q = `DELETE FROM students WHERE studentGroup = '${group}' AND fullName = '${name}'`;//видаляємо на основі вибірки
                db.connection.query(q, (error, result) => {
                    if (error) {
                        console.log(error, result);
                        return res.status(500).json({
                            message: "Помилка",
                        });
                    }
                    return res.status(200).json({
                        message: "Студента було видалено",
                    });
                });
            }
        });
    }
};

//Получить всех старост
exports.getStarosta = (req, res) => {
    db.connection.query("SELECT `fullName`,`starostaGroup`,`login`,`password` FROM starosta,students WHERE (starosta.starostaName = students.id)", (err, result) => {
        if (err) return res.status(500).json({message: "Помилка БД"});
        console.log(result);
        return res.send(result).status(200);
    });

};//Получить всех Преподов
exports.getPrepod = (req, res) => {
    db.connection.query("SELECT `fullName`,`prepodGroup`,`login`,`password` FROM prepod", (err, result) => {
        if (err) return res.status(500).json({message: "Помилка БД"});
        console.log(result);
        return res.send(result).status(200);
    });
};

// Добавлення препода
exports.insertingPrepod = (req, res) => {
    const {name, group, login, password} = req.body;

    if (name.length === 0 || group.length === 0 || login.length === 0 || password.length === 0) return res.status(500).json({message: "Заповніть форму",});
    db.connection.query(`SELECT * FROM prepod WHERE prepodGroup = ${group}`, (err, result) => {
        if (err) return res.status(500).json({message: "Помилка БД"});
        if (Object.keys(result).length === 0) {
            db.connection.query(`INSERT INTO prepod(fullName, prepodGroup, login, password) VALUES ("${name}","${group}","${login}","${password}")`, (err, result) => {
                if (err) return res.status(500).json({message: "Помилка, логін вже існує або такої групі не існує"});
                return res.status("200").json({message: "Успішно"});
            });
        } else if (result[0].fullName === name) {
            db.connection.query(`UPDATE prepod SET prepodGroup=${group}, login="${login}", password="${password}"`, (err, result) => {
                console.log(result, err);
                if (err) return res.status(500).json({message: "Помилка, логін вже існує"});
                return res.status("200").json({message: "Успішно"});
            });
        } else {
            return res.status(500).json({message: "Помилка, логін вже існує"});
        }
    });
};
// Добавлення старости групи
exports.insertingStarosta = (req, res) => {
    const {name, group, login, password} = req.body;
    let selectId = `SELECT id FROM students WHERE fullName = '${name}' AND studentGroup = '${group}'`;
    let check = `SELECT * FROM starosta WHERE starostaGroup = '${group}'`;

    if (name.length === 0 || group.length === 0) return res.status(500).json({message: "Ви не ввели студента",});
    db.connection.query(check, (err_check, result_check) => { // шукаю чи є такий студент і група
            if (typeof result_check === "undefined" || Object.keys(result_check).length === 0) { // якщо в групі ше немає старости, то добавляю
                db.connection.query(selectId, (error, result_select) => {  // шукаю його id, якщо є такий студент
                    if (result_select.length === 0) return res.status(500).json({message: "Такої групи або студента не існує"});
                    let query = `INSERT INTO starosta (starostaName, starostaGroup, login, password) VALUES (${result_select[0].id}, ${group}, ${login}, ${password})`; // добавляю старосту в групу
                    db.connection.query(query, (err, result) => {
                        if (err) return res.status(500).json({message: "Помилка, логін вже існує"});
                        return res.status(200).json({message: "Старосту було добавлено"});
                    });
                });
            } else {
                db.connection.query(selectId, (error, result_select) => { // якщо в групі вже є староста
                    if (result_select.length === 0 || result_select[0].id === "undefined") return res.status(500).json({message: "Такої групи або студента не існує"});
                    // обновлюю, старосту групи
                    let query = `UPDATE starosta SET starostaName='${result_select[0].id}', login='${login}', password='${password}' WHERE starostaGroup IN(SELECT studentGroup FROM students WHERE id = '${result_select[0].id}')`;
                    db.connection.query(query, (error, result) => {
                        if (error) return res.status(500).json({message: "Помилка"});
                        return res.status(200).json({message: "Старосту було добавлено"});
                    });
                });
            }
        }
    );
};
