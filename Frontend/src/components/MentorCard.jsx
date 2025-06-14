import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ReactStars from "react-rating-stars-component";
import axios from 'axios';
import { useRecoilValue } from 'recoil';
import { userState } from '../atoms/userAtoms';
import { onlineStatusState } from '../atoms/onlineStatusAtom';
import { useRef } from 'react';
const MentorCard = ({ mentor, isDarkMode }) => {

    const navigate = useNavigate();
    const user = useRecoilValue(userState);
    const onlineStatus = useRecoilValue(onlineStatusState);
    const [stars, setStars] = useState(mentor.stars);
    const [ws, setWs] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    let [id, setId] = useState(null);
    let interval = useRef(null);
    useEffect(() => {
        let id = null;
        let wsCopy = null;
        axios.get("https://campus-connect-1-7rgs.onrender.com/auth/dashboard", {
            withCredentials: true,
        }).then((response) => {
            id = response.data.user._id;
            setId(id);

            const ws = new WebSocket("wss://campus-connect-2-wvnt.onrender.com");
            wsCopy = ws;
            setWs(ws);
            ws.onopen = () => {
                console.log(
                    "hit me"
                );

                ws.send(JSON.stringify({ type: "online", content: { _id: response.data.user._id } }));
            }
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const { type, content } = data;
                console.log(data);
                if (data == "ping") {
                    ws.send("pong");
                }

                if (type == "get-statusR") {

                    if (content._id == mentor._id) {
                        setIsOnline(content.online);
                    }
                }
            }



        });


        return () => {
            if (wsCopy && wsCopy.readyState === WebSocket.OPEN) {
                wsCopy.send(JSON.stringify({ type: "offline", content: { _id: id } }));
                wsCopy.close();

            }
        };




    }, []);

    const handleChatClick = () => {
        if (id != null) {
            navigate(`/chat/${id}/${mentor._id}`);
        }
    };

    const handleRatingChange = async (newRating) => {
        try {
            const response = await axios.put('/api/mentor/update-stars', {
                applicationId: mentor._id,
                stars: newRating
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log(response.data.message);
            setStars(newRating);
        } catch (error) {
            console.error('Error updating stars:', error);
        }
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
        if (interval.current) {
            clearInterval(interval.current);
        }
        interval.current = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {

                ws.send(JSON.stringify({ type: "get-status", content: { _id: mentor._id } }));
            }

        }, 1000);
        ws.onmessage = (event) => {
            const { type, content } = JSON.parse(event.data);


            if (type == "get-statusR") {

                if (content._id == mentor._id) {
                    setIsOnline(content.online);
                }
            }
        }
    }
    return (
        <div className={`max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{mentor.username}</h3>
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                            title={isOnline ? 'Online' : 'Offline'} />
                    </div>
                    <button
                        onClick={handleChatClick}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        Chat
                    </button>
                </div>
                <p className="text-sm mt-1 text-gray-500">{mentor.email}</p>
                <div className="mt-4">
                    <p className="text-sm font-semibold">College</p>
                    <p className="text-sm text-gray-500">{mentor.collegename}</p>
                </div>
                {mentor.skills && mentor.skills.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold">Skills</p>
                        <p className="text-sm text-gray-500">{mentor.skills.join(', ')}</p>
                    </div>
                )}
                <div className="mt-4">
                    <p className="text-sm font-semibold">SPI</p>
                    <p className="text-sm text-gray-500">{mentor.spi}</p>
                </div>
                <div className="mt-4">
                    <p className="text-sm font-semibold">Mentor Since</p>
                    <p className="text-sm text-gray-500">{new Date(mentor.appliedAt).toLocaleDateString()}</p>
                </div>
                {mentor.achievements && mentor.achievements.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold">Achievements</p>
                        <ul className="list-disc list-inside text-sm text-gray-500">
                            {mentor.achievements.map((achievement, index) => (
                                <li key={index}>
                                    {achievement.title} - {achievement.description} ({new Date(achievement.date).toLocaleDateString()})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {mentor.internships && mentor.internships.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold">Internships</p>
                        <ul className="list-disc list-inside text-sm text-gray-500">
                            {mentor.internships.map((internship, index) => (
                                <li key={index}>
                                    {internship.company} - {internship.position} ({internship.duration})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-4">
                    <ReactStars
                        count={5}
                        value={stars}
                        onChange={handleRatingChange}
                        size={24}
                        activeColor="#ffd700"
                    />
                </div>
            </div>
        </div>
    );
};

export default MentorCard; 
