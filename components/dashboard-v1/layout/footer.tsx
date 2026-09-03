export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} Khulna 225 MW CCPP Attendance System. All rights
          reserved.
        </p>
        <p>
          Powered by <span className="font-medium text-slate-700 dark:text-slate-300"><a href="https://www.linkedin.com/in/delowarsikder/" target="_blank" rel="noopener noreferrer">Delowar Sikder</a>  </span>
        </p>
      </div>
    </footer>
  );
}