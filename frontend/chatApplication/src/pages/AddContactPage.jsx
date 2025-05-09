import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Phone, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { axiosInstance } from '../lib/axios';
import { debounce } from '../utils/debounce';

const AddContactPage = () => {
    const { addContact, addContactLoading } = authStore();
    const [userAvailable, setUserAvailable] = useState("");
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const [contactData, setContactData] = useState({
        name: '',
        phoneNumber: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!error && contactData.name.trim() && contactData.phoneNumber.trim()) {
            addContact(contactData, navigate);
        }
    };

    const checkUser = async (phoneNumber) => {
        try {
            const response = await axiosInstance.post(`/user/check`, { phoneNumber: phoneNumber });
            if (response.status === 200) {
                setError(false);
                setUserAvailable(response.data.message);
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                setError(true);
                if (contactData.phoneNumber!="")
                {
                setUserAvailable(error.response.data.message);
                }
            }
        }
    };

    const debouncedCheckUser = useMemo(() => debounce((phone) => {
        checkUser(phone);
    }, 500), []);

    useEffect(() => {
        if (contactData.phoneNumber === "") {
            setUserAvailable("");
            setError(false);
        } else if (contactData.phoneNumber) {
            debouncedCheckUser(contactData.phoneNumber);
        }
    }, [contactData.phoneNumber, debouncedCheckUser]);

    // Phone number formatter
    const formatPhoneNumber = (value) => {
        // Strip non-numeric characters
        const numericValue = value.replace(/\D/g, '');
        
        // Format for standard number (this is basic - you may want to adjust for your region)
        if (numericValue.length <= 10) {
            return numericValue;
        } else {
            // Handle international numbers
            return numericValue;
        }
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setContactData({ ...contactData, phoneNumber: formatted });
    };

    return (
        <div className="h-screen bg-[#1a1e23] grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
                {/* Pattern Background - Only visible on desktop */}
                <div className="absolute inset-0 opacity-10 hidden lg:block">
                    <div className="w-full h-full grid grid-cols-12 gap-4">
                        {Array(150).fill().map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-gray-400"></div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md space-y-8 z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-lg bg-[#0e7970] flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2 text-white">Add New Contact</h1>
                            <p className="text-gray-400">Enter contact details to save</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={(e) => handleSubmit(e)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Contact name"
                                    value={contactData.name}
                                    onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="tel"
                                    className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="+91 98765 43210"
                                    value={contactData.phoneNumber}
                                    onChange={handlePhoneChange}
                                    required
                                />
                            </div>
                            {userAvailable && (
                                <div className={`mt-2 text-sm ${error ? 'text-red-500' : 'text-green-500'}`}>
                                    {userAvailable}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Link
                                to="/"
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center justify-center"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                className={`flex-1 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center ${
                                    error || !contactData.name.trim() || !contactData.phoneNumber.trim() || addContactLoading
                                    ? 'bg-gray-500 cursor-not-allowed' 
                                    : 'bg-teal-500 hover:bg-teal-600'
                                }`}
                                disabled={error || !contactData.name.trim() || !contactData.phoneNumber.trim() || addContactLoading}
                            >
                                {addContactLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Save Contact
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Only visible on desktop */}
            <div className="hidden lg:flex bg-teal-500 flex-col justify-center items-center text-white p-12 relative">
                {/* Pattern Background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full grid grid-cols-12 gap-4">
                        {Array(150).fill().map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-white"></div>
                        ))}
                    </div>
                </div>

                <div className="max-w-md z-10">
                    <h2 className="text-3xl font-bold mb-4">Add new contacts</h2>
                    <p className="text-lg opacity-90">
                        Save contacts to quickly start conversations and share messages with friends and family.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddContactPage;