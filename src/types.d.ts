import { Session } from "./vk-session";
import { Reminder } from "./reminder";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            VK_TOKEN: string;
            VK_GROUP_ID: string;
            VK_API_VER: string;
            VK_APP_SECRET: string;
            PORT: string;
            DB_HOST: string;
            DB_NAME: string;
            DB_USER: string;
            DB_PASS: string;
        }
    }

    namespace Express {
        interface Request {
            session: Session;
            reminder?: Reminder;
        }
    }
}
