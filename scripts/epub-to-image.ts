import dotenv from 'dotenv';
import Epub from 'epub';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config();

async function extractImages(epubPath: string, outputDir: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const epub = new Epub(epubPath);
		const tasks: { id: string; imagePath: string }[] = [];

		epub.on('error', (err) => {
			console.error('Error reading EPUB:', err);
			reject(err);
		});

		epub.on('end', async () => {
			try {
				await fs.stat(outputDir);
			} catch {
				await fs.mkdir(outputDir);
			}

			for (const obj of Object.values(epub.manifest)) {
				if (obj['media-type'].toString().startsWith('image')) {
					const filename = path.basename(obj.href);
					const imagePath = path.join(outputDir, filename);
					try {
						await fs.stat(imagePath);
					} catch {
						tasks.push({ id: obj.id, imagePath });
					}
				}
			}

			if (tasks.length === 0) {
				resolve();
			} else {
				for (const task of tasks) {
					await new Promise((rs, rj) => {
						epub.getImage(task.id, async (err, data) => {
							if (err) {
								rj(err);
								return;
							}
							await fs.writeFile(task.imagePath, data);
							rs(undefined);
						});
					});
				}
				resolve();
			}
		});

		epub.parse();
	});
}

(async () => {
	const epubDir = process.env.KOBODL_ROOT as string;
	const mangaOutDir = process.env.COMIC_ROOT as string;

	const epubs = await fs.readdir(epubDir);

	for (const file of epubs) {
		const filepath = path.join(epubDir, file);
		const outDir = path.join(mangaOutDir, file);

		console.time(file);
		try {
			await extractImages(filepath, outDir);
		} catch (err) {
			console.error(err);
		}
		console.timeEnd(file);
	}
})();
