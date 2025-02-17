import "./globals.css";

export const metadata = {
  title: "User Management System",
  description: "A simple user management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
