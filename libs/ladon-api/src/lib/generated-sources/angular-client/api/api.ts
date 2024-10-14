export * from "./actions.service";
import { ActionsService } from "./actions.service";
export * from "./authentication.service";
import { AuthenticationService } from "./authentication.service";
export * from "./buckets.service";
import { BucketsService } from "./buckets.service";
export * from "./converter.service";
import { ConverterService } from "./converter.service";
export * from "./documents.service";
import { DocumentsService } from "./documents.service";
export * from "./downloads.service";
import { DownloadsService } from "./downloads.service";
export * from "./nodeInfo.service";
import { NodeInfoService } from "./nodeInfo.service";
export * from "./pluginmanager.service";
import { PluginmanagerService } from "./pluginmanager.service";
export * from "./stream.service";
import { StreamService } from "./stream.service";
export * from "./tasks.service";
import { TasksService } from "./tasks.service";
export * from "./transaction.service";
import { TransactionService } from "./transaction.service";
export * from "./usermanager.service";
import { UsermanagerService } from "./usermanager.service";
export * from "./users.service";
import { UsersService } from "./users.service";
export const APIS = [
	ActionsService,
	AuthenticationService,
	BucketsService,
	ConverterService,
	DocumentsService,
	DownloadsService,
	NodeInfoService,
	PluginmanagerService,
	StreamService,
	TasksService,
	TransactionService,
	UsermanagerService,
	UsersService,
];
