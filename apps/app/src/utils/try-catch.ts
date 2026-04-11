type SuccessResult<T> = readonly [T, null];
type ErrorResult<TError = Error> = readonly [null, TError];
type Result<T, TError = Error> = SuccessResult<T> | ErrorResult<TError>;

export async function tryCatch<T, TError = Error>(promise: Promise<T>): Promise<Result<T, TError>> {
  try {
    const data = await promise;
    return [data, null] as const;
  } catch (error) {
    return [null, error as TError] as const;
  }
}
