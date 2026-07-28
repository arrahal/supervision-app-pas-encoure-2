import { AppData, DocumentFile } from '../types';
import { getGistCfg, saveGistCfg, setGistLastPush, getAllDocs } from './storage';

const GIST_FILENAME = 'superviseur_data.json';
const GIST_DOCS_FILE = 'superviseur_docs.json';

export async function gistPush(db: AppData): Promise<{ success: boolean; message: string; totalDocs?: number }> {
  const { token, gistId } = getGistCfg();
  if (!token) {
    return { success: false, message: 'لم يتم إدخال التوكن الخص بك في الإعدادات.' };
  }

  const content = JSON.stringify(db, null, 2);
  const allDocs = getAllDocs();
  const docsContent = JSON.stringify(allDocs, null, 2);
  const dateStr = new Date().toLocaleString('ar-MA');

  const body = {
    description: `المشرف التربوي — نسخة احتياطية — ${dateStr}`,
    public: false,
    files: {
      [GIST_FILENAME]: { content },
      [GIST_DOCS_FILE]: { content: docsContent },
    },
  };

  try {
    let res: Response;
    if (gistId) {
      res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      const msg = data.message || res.statusText;
      if (res.status === 401) {
        return { success: false, message: 'التوكن غير صحيح أو منتهي الصلاحية.' };
      }
      return { success: false, message: `خطأ أثناء الحفظ: ${msg}` };
    }

    saveGistCfg(token, data.id);
    const now = new Date().toISOString();
    setGistLastPush(now);

    const totalDocsCount = Object.values(allDocs).reduce((s, arr) => s + arr.length, 0);
    return {
      success: true,
      message: `تم رفع البيانات + ${totalDocsCount} وثيقة إلى GitHub Gist بنجاح!`,
      totalDocs: totalDocsCount,
    };
  } catch (err: any) {
    return { success: false, message: 'فشل الاتصال بـ GitHub. تحقق من الاتصال بالإنترنت.' };
  }
}

export async function gistPull(): Promise<{
  success: boolean;
  message: string;
  db?: AppData;
  docs?: Record<string, DocumentFile[]>;
  updatedAt?: string;
}> {
  const { token, gistId } = getGistCfg();
  if (!token || !gistId) {
    return { success: false, message: 'يرجى إدخال التوكن و Gist ID أولاً في الإعدادات.' };
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) return { success: false, message: 'التوكن غير صحيح.' };
      if (res.status === 404) return { success: false, message: 'لم يُعثر على Gist بالمعرف المحدد.' };
      return { success: false, message: `خطأ في الاستجابة: ${res.status}` };
    }

    const data = await res.json();
    const file = data.files?.[GIST_FILENAME];
    if (!file) {
      return { success: false, message: 'لم يتم العثور على ملف البيانات الأساسية في هذا Gist.' };
    }

    const raw = file.content || (await (await fetch(file.raw_url)).text());
    const importedDb = JSON.parse(raw) as AppData;

    if (!importedDb.animateurs || !importedDb.groupes || !importedDb.ecoles) {
      return { success: false, message: 'ملف البيانات غير مكتمل أو تالف.' };
    }

    let importedDocs: Record<string, DocumentFile[]> | undefined = undefined;
    const docsFile = data.files?.[GIST_DOCS_FILE];
    if (docsFile) {
      try {
        const docsRaw = docsFile.content || (await (await fetch(docsFile.raw_url)).text());
        importedDocs = JSON.parse(docsRaw);
      } catch (e) {
        console.warn('Docs file in gist could not be parsed', e);
      }
    }

    const updatedAt = new Date(data.updated_at).toLocaleString('ar-MA');

    return {
      success: true,
      message: 'تم جلب البيانات بنجاح!',
      db: importedDb,
      docs: importedDocs,
      updatedAt,
    };
  } catch (err: any) {
    return { success: false, message: 'خطأ في الاتصال بالسيرفر أو معالجة البيانات.' };
  }
}
