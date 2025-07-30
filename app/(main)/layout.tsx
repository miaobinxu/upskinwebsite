import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import { Toaster } from 'react-hot-toast'

export default function layout({ children }: React.PropsWithChildren<{}>) {
    return (
        <>
            <div className="flex flex-col h-full min-h-screen bg-[#F7F7F7]">
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
            </div>
            <Toaster position="top-center" reverseOrder={false} />
        </>

    )
}
