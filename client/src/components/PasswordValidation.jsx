import React, { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

const PasswordValidation = ({ onValidPassword, onClose }) => {
    const [password, setPassword] = useState("");
    const [type, setType] = useState("password");
    const [lowerValidated, setLowerValidated] = useState(false);
    const [upperValidated, setUpperValidated] = useState(false);
    const [numberValidated, setNumberValidated] = useState(false);
    const [specialValidated, setSpecialValidated] = useState(false);
    const [lengthValidated, setLengthValidated] = useState(false);
    const [validationMessage, setValidationMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        validatePassword(newPassword);
    };
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const validatePassword = (value) => {
        const lower = new RegExp("(?=.*[a-z])");
        const upper = new RegExp("(?=.*[A-Z])");
        const number = new RegExp("(?=.*[0-9])");
        const special = new RegExp("(?=.*[!@#\\$%\\^&\\*])");
        const length = new RegExp("^.{8}$");  // Exact 8 characters


        setLowerValidated(lower.test(value));
        setUpperValidated(upper.test(value));
        setNumberValidated(number.test(value));
        setSpecialValidated(special.test(value));
        setLengthValidated(length.test(value));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (
            lowerValidated &&
            upperValidated &&
            numberValidated &&
            specialValidated &&
            lengthValidated
        ) {
            onValidPassword(password);
        } else {
            setValidationMessage("Please input a valid password as required.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center font-['Roboto'] items-center z-50" onClick={handleOverlayClick}>
            <div className="bg-white p-6 rounded-lg w-80 shadow-lg relative">
                <h2 className="text-xl font-semibold font-['Roboto'] mb-4 text-center">
                    Enter an Encryption Key
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Enter decryption key"
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        <span
                            className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                    <div className="mt-4 font-['Roboto']">
                        <div className={lowerValidated ? "text-green-600" : "text-red-600"}>
                            <div className="flex items-center">
                                {lowerValidated ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                <span className="ml-2 font-['Roboto']">At least one lowercase letter</span>
                            </div>
                        </div>
                        <div className={upperValidated ? "text-green-600" : "text-red-600"}>
                            <div className="flex items-center">
                                {upperValidated ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                <span className="ml-2 font-['Roboto']">At least one uppercase letter</span>
                            </div>
                        </div>
                        <div className={numberValidated ? "text-green-600" : "text-red-600"}>
                            <div className="flex items-center">
                                {numberValidated ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                <span className="ml-2 font-['Roboto']">At least one number</span>
                            </div>
                        </div>
                        <div className={specialValidated ? "text-green-600" : "text-red-600"}>
                            <div className="flex items-center">
                                {specialValidated ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                <span className="ml-2 font-['Roboto']">At least one special character</span>
                            </div>
                        </div>
                        <div className={lengthValidated ? "text-green-600" : "text-red-600"}>
                            <div className="flex items-center">
                                {lengthValidated ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                <span className="ml-2 font-['Roboto']">Only 8 characters</span>
                            </div>
                        </div>
                    </div>
                    {validationMessage && (
                        <div className="text-red-600 text-sm mt-2 text-center">
                            {validationMessage}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mt-4"
                    >
                        Submit
                    </button>
                </form>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-xl text-gray-500 hover:text-red-500"
                >
                    X
                </button>
            </div>
        </div>
    );
};

export default PasswordValidation;
