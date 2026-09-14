import './globals.css';

export const metadata = {
  title: 'Helpbuddy - Premium Issue Tracker',
  description: 'Enterprise issue tracking and seamless internal communication. We do not see data of any organization.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
