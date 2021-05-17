import {
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    makeStyles,
    TextField
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { Alert, AlertTitle } from "@material-ui/lab";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import PrepodTable from "../table/prepod-table";

const useStyles = makeStyles((theme) => ({
    card: {
        [theme.breakpoints.up("xs")]: {
            textAlign: "center",
            "& Button":{
                marginBottom: "1em",
                marginTop: "1em"
            },
            "& .MuiFormControl-root": {
                marginBottom: "1em",
            }
        },
        [theme.breakpoints.up("sm")]: {
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            "& #name": {
                width: "16rem",
            },
            "& #group": {
                width: "2rem",
            },
            "& .MuiInputBase-input": {
                fontSize: "13px",
                height: "2.1876em",
            },
            "& .MuiTypography-body1": {
                fontSize: "12px",
            },
            "& Button": {
                fontSize: "13px",
                marginTop: "2em",
                marginBottom: "2em"
            },
            "& .MuiFormLabel-root": {
                fontSise: "11px",
            },
            "& .MuiFormControl-root": {
                marginBottom: "1em"
            }
        },

        [theme.breakpoints.up("md")]: {
            display: "flex",
            justifyContent: "space-between",
            "& #name": {
                width: "20rem",
            },
            "& #group": {
                width: "4rem",
            },
            "& .MuiInputBase-input": {
                fontSize: "17px",
                height: "2.1876em",
            },
            "& .MuiTypography-body1": {
                fontSize: "12px",
            },
        },

        [theme.breakpoints.up("lg")]: {
            justifyContent: "space-evently!",
            "& .MuiOutlinedInput-input": {
                fontSize: 20,
            },
            "& Button": {
                fontSize: 20,
                height: 75,
            },
            "& #name": {
                width: "25rem",
            },
        },
    },
    alert: {
        marginTop: "2em",
    }
}));

function AddPrepodForm() {
    const classes = useStyles();
    const { register, handleSubmit } = useForm([]);
    const [open, setOpen] = useState(false);
    const [alertopen, setAlertOpen] = useState(true);
    const [result, setResult] = useState([]);
    const [list, setList] = useState([]);
    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setAlertOpen(true);
    };

    const getList = async () => {
        await fetch("http://45.141.79.25:4000/api/getprepod", {
            method: "POST",
            mode: "cors",
        }).then(async (res) => await res.json()).then(async (res) => setList(res));
    };

    const onSubmit = async (data) => {
        // Берёт значение с формы и конвертирует их в нужный формат для отправки на сервер
        let formData = new FormData();
        for (let key in data) {
            formData.append(key, data[key]);
        }
        //--------------------------------
        //Отправка формы в бд на выборку
        fetch("http://45.141.79.25:4000/api/addnewprepod", {
            method: "POST",
            mode: "cors",
            body: formData,
        })
            .then(async (res) => {
                return await res.json();
            })
            .then(async (res) => {
                setResult(res);
            })
            .catch((err) => {
                console.log(err, "<<<<<<<");
            }, []);
    };
    const onErr = (err) => {
        console.log(err);
    };
    return (
        <div>
            <PrepodTable list={list} />
            <Button color="primary" variant="outlined" onClick={getList}>Отримати список викладачів</Button>
            <form onSubmit={handleSubmit(onSubmit, onErr)} id="insert_prepod" className={classes.card}>
                <div>
                    <TextField
                        inputRef={register}
                        id="group"
                        name="group"
                        type="number"
                        label="Група"
                    />
                </div>
                <div>
                    <TextField
                        inputRef={register}
                        id="name"
                        type="text"
                        name="name"
                        label="ПІП"
                    />
                </div>
                <div>
                    <TextField
                        inputRef={register}
                        id="login"
                        name="login"
                        type="text"
                        label="Логін"
                    />
                </div>
                <div>
                    <TextField
                        inputRef={register}
                        id="password"
                        name="password"
                        type="text"
                        label="Пароль"
                    />
                </div>
                <Dialog
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Добавити старосту?"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Ви впевнені,що хочете добавити нового викладача?
                        </DialogContentText>
                        <b> (Якщо викладач вже існує, його логін, пароль буде змінено)</b>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="primary">
                            Закрити
                        </Button>
                        <Button variant="contained" color="primary" type="submit" form="insert_prepod"
                            onClick={handleClose}>
                            Добавити
                        </Button>
                    </DialogActions>
                </Dialog>
                <Button variant="contained" color="primary" onClick={handleOpen}>
                    Відправити
                </Button>
            </form>
            <div className={classes.alert}>
                {result.message === 'Заповніть форму' ? (<Alert severity="info">
                    <AlertTitle>Info</AlertTitle>
                    <strong>{result.message}</strong>
                </Alert>) : result.message === 'Помилка, логін вже існує' || result.message === 'Помилка, логін вже існує або такої групі не існує' || result.message === 'Помилка, такої групи не існує' || result.message === "Помилка" || result.message === "Помилка БД" ? (
                    <div>
                        <Collapse in={alertopen}>
                            <Alert
                                severity="warning"
                                action={
                                    <IconButton
                                        aria-label="close"
                                        color="inherit"
                                        size="small"
                                        onClick={() => {
                                            setAlertOpen(false);
                                        }}
                                    >
                                        <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                }
                            >
                                <strong>{result.message}</strong>
                            </Alert>
                        </Collapse>
                    </div>) : result.message === 'Успішно' ? ((<div>
                        <Collapse in={alertopen}>
                            <Alert
                                action={
                                    <IconButton
                                        aria-label="close"
                                        color="inherit"
                                        size="small"
                                        onClick={() => {
                                            setAlertOpen(false);
                                        }}
                                    >
                                        <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                }
                            >
                                <strong>{result.message}</strong>
                            </Alert>
                        </Collapse>
                    </div>)) : (<div> </div>)}
            </div>
        </div>
    );
}

export default AddPrepodForm;
