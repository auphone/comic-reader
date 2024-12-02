export interface Vol {
	volId: number;
	title: string;
	cover: string;
	author: string;
	folder: string;
	dimensions?: {
		width: number;
		height: number;
	};
	pagePaths?: string[];
	downloaded?: boolean;
}

export interface Comic {
	comicId: string;
	title: string;
	author: string;
	cover: string;
	vols: Vol[];
}
