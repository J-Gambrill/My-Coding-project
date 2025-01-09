//I am using AuthContext to import the token appwide. This allows it to be shared across all components.

import React, { createContext, useState, useEffect} from 'react'

export const AuthContext = createContext()

export const AuthProvider = ({children}) => {
    const [token, setToken] = useState(null)
    const [authenticated, setAuthenticated] = useState(False)

    useEffect(() => {
        //checks if a token currently exists on app load
        const storedToken = localStorage.getItem('access_token')
        if (storedToken) {
            setToken(storedToken)
            setAuthenticated(true)
        }
    }, [])

    const logout = () => {
        localStorage.removeItem('access_token')
        setToken=null
        setAuthenticated(false)
    }

 //what is going on below?
 //This:
 // authcontext.provider allows you to share the data with any component in the app
 // value is the data being provide to the components wrapped by AuthContext.provider
 // children is a special prop that represents all components held inside AuthProvider. (i will render all the components inside auth provider see AlertTable)

    return (
        <AuthContext.Provider value={{ token, setToken, authenticated, setAuthenticated, logout}}>
            {children}
        </AuthContext.Provider>
    )
}