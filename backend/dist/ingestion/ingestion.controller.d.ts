import { IngestionService } from './ingestion.service';
export declare class IngestionController {
    private readonly ingestionService;
    constructor(ingestionService: IngestionService);
    runIngestion(): Promise<{
        success: boolean;
        message: string;
        filesProcessed?: undefined;
        rowsProcessed?: undefined;
        pdfPages?: undefined;
    } | {
        success: boolean;
        filesProcessed: number;
        rowsProcessed: number;
        pdfPages: number;
        message?: undefined;
    }>;
    getJobs(): Promise<any>;
}
