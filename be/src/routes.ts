import { Router, type Request, type Response } from "express";

import { asyncHandler, getUserId, userMiddleware } from "./middleware.js";
import {
  accountSchema,
  costEntrySchema,
  createMonthlyRecordSchema,
  idParamsSchema,
  incomeEntrySchema,
  monthlyParamsSchema,
  monthYearSchema,
  recurringCostConfigurationSchema,
} from "./schemas.js";
import {
  createAccount,
  createIncomeEntry,
  createMonthlyRecord,
  createOtherCostEntry,
  createRecurringCostConfiguration,
  deleteAccount,
  deleteIncomeEntry,
  deleteMonthlyRecord,
  deleteOtherCostEntry,
  deleteRecurringCostConfiguration,
  deleteRecurringCostInstance,
  fetchMonthlyRecord,
  listAccounts,
  listRecurringCostConfigurations,
  updateAccount,
  updateIncomeEntry,
  updateOtherCostEntry,
  updateRecurringCostConfiguration,
  updateRecurringCostInstance,
} from "./services.js";

const apiRouter = Router();

apiRouter.use(userMiddleware);

const getIdParam = (request: Request) => idParamsSchema.parse(request.params).id;

const getMonthlyRecordIdParam = (request: Request) =>
  monthlyParamsSchema.parse(request.params).monthlyRecordId;

apiRouter.get(
  "/accounts",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await listAccounts(getUserId(request)));
  }),
);

apiRouter.post(
  "/accounts",
  asyncHandler(async (request: Request, response: Response) => {
    const body = accountSchema.parse(request.body as unknown);
    response.status(201).json(await createAccount(getUserId(request), body));
  }),
);

apiRouter.put(
  "/accounts/:id",
  asyncHandler(async (request: Request, response: Response) => {
    const body = accountSchema.parse(request.body as unknown);
    response.json(await updateAccount(getUserId(request), getIdParam(request), body));
  }),
);

apiRouter.delete(
  "/accounts/:id",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await deleteAccount(getUserId(request), getIdParam(request)));
  }),
);

apiRouter.get(
  "/recurring-costs",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await listRecurringCostConfigurations(getUserId(request)));
  }),
);

apiRouter.post(
  "/recurring-costs",
  asyncHandler(async (request: Request, response: Response) => {
    const body = recurringCostConfigurationSchema.parse(request.body as unknown);
    response.status(201).json(await createRecurringCostConfiguration(getUserId(request), body));
  }),
);

apiRouter.put(
  "/recurring-costs/:id",
  asyncHandler(async (request: Request, response: Response) => {
    const body = recurringCostConfigurationSchema.parse(request.body as unknown);
    response.json(
      await updateRecurringCostConfiguration(getUserId(request), getIdParam(request), body),
    );
  }),
);

apiRouter.delete(
  "/recurring-costs/:id",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await deleteRecurringCostConfiguration(getUserId(request), getIdParam(request)));
  }),
);

apiRouter.get(
  "/monthly-records",
  asyncHandler(async (request: Request, response: Response) => {
    const monthYearResult = monthYearSchema.safeParse(request.query.monthYear);

    if (!monthYearResult.success) {
      response.status(400).json({ message: "Month-year must use Month YYYY format." });
      return;
    }

    response.json(await fetchMonthlyRecord(getUserId(request), monthYearResult.data));
  }),
);

apiRouter.post(
  "/monthly-records",
  asyncHandler(async (request: Request, response: Response) => {
    const body = createMonthlyRecordSchema.parse(request.body as unknown);
    response.status(201).json(await createMonthlyRecord(getUserId(request), body.monthYear));
  }),
);

apiRouter.delete(
  "/monthly-records/:id",
  asyncHandler(async (request: Request, response: Response) => {
    await deleteMonthlyRecord(getUserId(request), getIdParam(request));
    response.status(204).send();
  }),
);

apiRouter.post(
  "/monthly-records/:monthlyRecordId/income-entries",
  asyncHandler(async (request: Request, response: Response) => {
    const body = incomeEntrySchema.parse(request.body as unknown);
    response
      .status(201)
      .json(await createIncomeEntry(getUserId(request), getMonthlyRecordIdParam(request), body));
  }),
);

apiRouter.put(
  "/income-entries/:id",
  asyncHandler(async (request: Request, response: Response) => {
    const body = incomeEntrySchema.parse(request.body as unknown);
    response.json(await updateIncomeEntry(getUserId(request), getIdParam(request), body));
  }),
);

apiRouter.delete(
  "/income-entries/:id",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await deleteIncomeEntry(getUserId(request), getIdParam(request)));
  }),
);

apiRouter.put(
  "/recurring-cost-instances/:id",
  asyncHandler(async (request: Request, response: Response) => {
    const body = costEntrySchema.parse(request.body as unknown);
    response.json(
      await updateRecurringCostInstance(getUserId(request), getIdParam(request), body),
    );
  }),
);

apiRouter.delete(
  "/recurring-cost-instances/:id",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await deleteRecurringCostInstance(getUserId(request), getIdParam(request)));
  }),
);

apiRouter.post(
  "/monthly-records/:monthlyRecordId/other-cost-entries",
  asyncHandler(async (request: Request, response: Response) => {
    const body = costEntrySchema.parse(request.body as unknown);
    response.status(201).json(
      await createOtherCostEntry(getUserId(request), getMonthlyRecordIdParam(request), body),
    );
  }),
);

apiRouter.put(
  "/other-cost-entries/:id",
  asyncHandler(async (request: Request, response: Response) => {
    const body = costEntrySchema.parse(request.body as unknown);
    response.json(await updateOtherCostEntry(getUserId(request), getIdParam(request), body));
  }),
);

apiRouter.delete(
  "/other-cost-entries/:id",
  asyncHandler(async (request: Request, response: Response) => {
    response.json(await deleteOtherCostEntry(getUserId(request), getIdParam(request)));
  }),
);

export { apiRouter };
