export type Language = 'id' | 'en' | 'jv';

export const translations = {
    id: {
        brand: {
            title: "TempMail",
            subtitle: "Profesional"
        },
        card: {
            title: "Alamat Sementara Anda",
            empty: "Belum ada email dibuat.",
            copied: "Disalin ke Clipboard!",
            createTitle: "Buat Identitas Baru",
            placeholderName: "Nama kustom (opsional)",
            generateBtn: "Buat Email",
            loadingDomains: "Memuat Domain...",
            copyFail: "Gagal Menyalin",
            edit: "Ubah Nama",
            delete: "Hapus Identitas"
        },
        stats: {
            messages: "Pesan",
            active: "Aktif",
            status: "Status",
            total: "Total Dibuat"
        },
        inbox: {
            title: "Kotak Masuk",
            refreshToast: "Menyegarkan inbox...",
            waiting: "Menunggu email masuk...",
            sendTo: "Kirim email test ke",
            selectMsg: "Pilih pesan untuk dibaca",
            newMsg: "Pesan Baru Diterima! 📬"
        },
        toast: {
            created: "Identitas Dibuat",
            createdDesc: "Email baru Anda siap digunakan:",
            genFailed: "Gagal Membuat",
            genFailedDesc: "Terjadi kesalahan. Silakan coba lagi.",
            copySuccess: "Disalin ke Clipboard",
            identityRemoved: "Identitas Dihapus",
            identityRemovedDesc: "Email saat ini telah dihapus.",
            editIdentity: "Ubah Identitas",
            editDesc: "Ubah nama di bawah dan klik Buat Email."
        },
        footer: {
            docs: "Dokumentasi API",
            powered: "Ditenagai oleh Cloudflare Workers & Next.js",
            credit: "Dibuat dengan penuh ❤️ oleh Andrian Daddynya Windaa"
        }
    },
    en: {
        brand: {
            title: "TempMail",
            subtitle: "Professional"
        },
        card: {
            title: "Your Temporary Address",
            empty: "No email generated yet.",
            copied: "Copied to Clipboard!",
            createTitle: "Create New Identity",
            placeholderName: "Custom name (opt)",
            generateBtn: "Generate",
            loadingDomains: "Loading Domains...",
            copyFail: "Copy Failed",
            edit: "Edit Name",
            delete: "Delete Identity"
        },
        stats: {
            messages: "Messages",
            active: "Active",
            status: "Status",
            total: "Total Generated"
        },
        inbox: {
            title: "Inbox",
            refreshToast: "Refreshing inbox...",
            waiting: "Waiting for incoming emails...",
            sendTo: "Send an email to",
            selectMsg: "Select a message to read",
            newMsg: "New Message Received! 📬"
        },
        toast: {
            created: "Identity Created",
            createdDesc: "Your new email is ready:",
            genFailed: "Generation Failed",
            genFailedDesc: "Something went wrong. Please try again.",
            copySuccess: "Copied to Clipboard",
            identityRemoved: "Identity Removed",
            identityRemovedDesc: "Current email has been cleared.",
            editIdentity: "Edit Identity",
            editDesc: "Modify the name below and click Generate."
        },
        footer: {
            docs: "API Documentation",
            powered: "Powered by Cloudflare Workers & Next.js",
            credit: "Made with ❤️ by Andrian (Winda's Daddy)"
        }
    },
    jv: {
        brand: {
            title: "TempMail",
            subtitle: "Profesional"
        },
        card: {
            title: "Alamat Sementara Panjenengan",
            empty: "Dereng wonten email.",
            copied: "Sampun disalin!",
            createTitle: "Damel Identitas Anyar",
            placeholderName: "Asma kustom (opsional)",
            generateBtn: "Gawe Email",
            loadingDomains: "Nglamar Domain...",
            copyFail: "Gagal Nyalin",
            edit: "Ganti Jeneng",
            delete: "Busak Identitas"
        },
        stats: {
            messages: "Pesen",
            active: "Aktif",
            status: "Status",
            total: "Total Digawe"
        },
        inbox: {
            title: "Kotak Masuk",
            refreshToast: "Nglamar inbox...",
            waiting: "Ngenteni email mlebu...",
            sendTo: "Kirim email test menyang",
            selectMsg: "Pilih pesen sing arep diwaca",
            newMsg: "Pesen Anyar Mlebu! 📬"
        },
        toast: {
            created: "Identitas Digawe",
            createdDesc: "Email anyar panjenengan siyap:",
            genFailed: "Gagal Gawe",
            genFailedDesc: "Wonten kesalahan. Cobi malih.",
            copySuccess: "Sampun Disalin",
            identityRemoved: "Identitas Dibusak",
            identityRemovedDesc: "Email sakmenika sampun dibusak.",
            editIdentity: "Ganti Identitas",
            editDesc: "Ganti jeneng ing ngisor lan klik Gawe Email."
        },
        footer: {
            docs: "Dokumentasi API",
            powered: "Didukung dening Cloudflare Workers & Next.js",
            credit: "Digawe kanthi ❤️ dening Andrian (Bapake Winda)"
        }
    }
};
