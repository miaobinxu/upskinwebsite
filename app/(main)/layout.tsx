import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'

export default function layout({ children }: React.PropsWithChildren<{}>) {
    return (
        <div className="" style={{ backgroundColor: "#F7F7F7" }}>
            <Navbar />
            {children}
            <Footer />
        </div>
    )
}
