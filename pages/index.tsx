import {useRef, useState, useEffect} from "react";
import styles from "../styles/Home.module.css";
import {
    Formik,
    Form,
    useField,
    FieldAttributes
} from "formik";
import {
    TextField,
    Button,
    Radio,
    FormControlLabel
} from "@material-ui/core";
import * as yup from "yup";
import axios from "axios";


type MyRadioProps = { label: string } & FieldAttributes<{}>;

const MyRadio: React.FC<MyRadioProps> = ({label, ...props}) => {
    const [field] = useField<{}>(props);
    return <FormControlLabel {...field} control={<Radio/>} label={label}/>;
};

const MyTextField: React.FC<FieldAttributes<{}>> = ({
                                                        placeholder,
                                                        ...props
                                                    }) => {
    const [field, meta] = useField<{}>(props);
    const errorText = meta.error && meta.touched ? meta.error : "";
    return (
        <TextField
            placeholder={placeholder}
            {...field}
            helperText={errorText}
            error={!!errorText}
        />
    );
};

const validationSchema = yup.object({
    firstName: yup
        .string()
        .required(),
    lastName: yup
        .string()
        .required(),
    id: yup
        .string()
        .min(11)
        .max(11),
    nip: yup
        .string()
        .min(10)
        .max(10)
});

function isValidPesel(pesel: string) {
    if (typeof pesel !== 'string')
        return false;

    let weight = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    let controlNumber = parseInt(pesel.substring(10, 11));

    for (let i = 0; i < weight.length; i++) {
        sum += (parseInt(pesel.substring(i, i + 1)) * weight[i]);
    }
    sum = sum % 10;
    return (10 - sum) % 10 === controlNumber;
}

function isValidNip(nip: string) {
    if (typeof nip !== 'string')
        return false;

    nip = nip.replace(/[\ \-]/gi, '');

    let weight = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    let controlNumber = parseInt(nip.substring(9, 10));
    let weightCount = weight.length;
    for (let i = 0; i < weightCount; i++) {
        sum += (parseInt(nip.substr(i, 1)) * weight[i]);
    }

    return sum % 11 === controlNumber;
}

const onSelectedImage = (fileInputRef, event) => {
    event.preventDefault();
    fileInputRef.current.click();
}

const onSubmitForm = async (data) => {
    const fr = new FileReader()
    // make async call
    const imageData = await data.image.text();
    console.log(imageData)

    //fr.readAsDataURL(data.image)
    try {
        await axios.post("https://localhost:60001/Contractor/Save", {
            ...data,
            image: imageData
        });
    } catch (e) {
        console.log("Nie znaleziono metody zapisu:", e)
    }

}

export default function Home() {
    const [image, setImage] = useState<File>();
    const [preview, setPreview] = useState<string>();
    const fileInputRef = useRef<HTMLInputElement>();

    useEffect(() => {
        if (image) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(image);
        } else {
            setPreview(null);
        }
    }, [image]);

    return (
        <div className={styles.container}>
            <div>
                <Formik
                    validateOnChange={true}
                    initialValues={{
                        firstName: "",
                        lastName: "",
                        type: "person",
                        id: "",
                        nip: "",
                    }}
                    validationSchema={validationSchema}
                    validate={values => {
                        const errors: Record<string, string> = {};

                        if (values.type === 'person') {
                            values.nip = "";
                            if (!isValidPesel(values.id)) {
                                errors.id = "invalid id number";
                            }
                        } else if (!isValidNip(values.nip)) {
                            values.id = "";
                            errors.nip = "invalid nip number";
                        }
                        return errors;
                    }}

                    onSubmit={(values) => onSubmitForm({
                        firstName: values.firstName,
                        lastName: values.lastName,
                        type: values.type,
                        id: values.id,
                        nip: values.nip,
                        image
                    })}
                >
                    {({values, errors, isSubmitting}) => (
                        <Form>
                            <div>
                                <h4 className="title">First name</h4>
                                <MyTextField placeholder="First name" name="firstName"/>
                            </div>

                            <div>
                                <h4 className="title">Last name</h4>
                                <MyTextField placeholder="Last name" name="lastName"/>
                            </div>

                            <MyRadio name="type" type="radio" value="person" label="Person"/>
                            <MyRadio name="type" type="radio" value="business" label="Business"/>


                            {values.type === 'person' ?
                                <div>
                                    <h4 className="title">Pesel</h4>
                                    <MyTextField placeholder="PESEL" name="id"/>
                                </div>
                                :
                                <div>
                                    <h4 className="title">Nip</h4>
                                    <MyTextField placeholder="NIP" name="nip"/>
                                </div>
                            }


                            {preview ? (
                                <img
                                    src={preview}
                                    style={{objectFit: "cover"}}
                                    onClick={() => {
                                        setImage(null);
                                    }}
                                />
                            ) : (
                                <button
                                    onClick={(event) => onSelectedImage(fileInputRef, event)}
                                >
                                    Add Image
                                </button>
                            )}
                            <input
                                type="file"
                                style={{display: "none"}}
                                ref={fileInputRef}
                                accept="image/jpg, image/jpeg"
                                onChange={(event) => {
                                    const file = event.target.files[0];
                                    setImage(file);
                                }}
                            />
                            <div>
                                <Button disabled={isSubmitting} type="submit">
                                    submit
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
