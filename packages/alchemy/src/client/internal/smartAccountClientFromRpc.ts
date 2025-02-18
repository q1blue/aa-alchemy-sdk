import {
  createSmartAccountClientFromExisting,
  getDefaultUserOperationFeeOptions,
  type SmartContractAccount,
} from "@alchemy/aa-core";
import type { Chain, CustomTransport, Transport } from "viem";
import { alchemyFeeEstimator } from "../../middleware/feeEstimator.js";
import { alchemyGasManagerMiddleware } from "../../middleware/gasManager.js";
import { alchemyUserOperationSimulator } from "../../middleware/userOperationSimulator.js";
import { alchemyActions } from "../decorators/smartAccount.js";
import type {
  AlchemySmartAccountClient,
  AlchemySmartAccountClientConfig,
} from "../smartAccountClient";
import type { ClientWithAlchemyMethods } from "../types";

export type CreateAlchemySmartAccountClientFromRpcClient<
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  TContext extends Record<string, any> | undefined =
    | Record<string, any>
    | undefined
> = Omit<
  AlchemySmartAccountClientConfig<Transport, Chain, TAccount, TContext>,
  "rpcUrl" | "chain" | "apiKey" | "jwt"
> & { client: ClientWithAlchemyMethods };

/**
 * Helper method meant to be used internally to create an alchemy smart account client
 * from an existing Alchemy Rpc Client
 */
export function createAlchemySmartAccountClientFromRpcClient<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  TContext extends Record<string, any> | undefined =
    | Record<string, any>
    | undefined
>(
  args: CreateAlchemySmartAccountClientFromRpcClient<TAccount, TContext>
): AlchemySmartAccountClient<
  CustomTransport,
  TChain,
  TAccount,
  Record<string, never>,
  TContext
>;

export function createAlchemySmartAccountClientFromRpcClient({
  opts,
  account,
  useSimulation,
  gasManagerConfig,
  feeEstimator,
  gasEstimator,
  customMiddleware,
  signUserOperation,
  client,
}: CreateAlchemySmartAccountClientFromRpcClient): AlchemySmartAccountClient {
  const feeOptions =
    opts?.feeOptions ?? getDefaultUserOperationFeeOptions(client.chain);

  return createSmartAccountClientFromExisting({
    account,
    client,
    type: "AlchemySmartAccountClient",
    opts: {
      ...opts,
      feeOptions,
    },
    customMiddleware,
    feeEstimator: feeEstimator ?? alchemyFeeEstimator(client),
    userOperationSimulator: useSimulation
      ? alchemyUserOperationSimulator(client)
      : undefined,
    gasEstimator,
    ...(gasManagerConfig &&
      alchemyGasManagerMiddleware(client, {
        ...gasManagerConfig,
        gasEstimationOptions: {
          ...gasManagerConfig.gasEstimationOptions,
          disableGasEstimation:
            gasManagerConfig.gasEstimationOptions?.disableGasEstimation ??
            false,
          fallbackFeeDataGetter:
            gasManagerConfig.gasEstimationOptions?.fallbackFeeDataGetter ??
            feeEstimator,
          fallbackGasEstimator:
            gasManagerConfig.gasEstimationOptions?.fallbackGasEstimator ??
            gasEstimator,
        },
      })),
    signUserOperation,
  }).extend(alchemyActions);
}
