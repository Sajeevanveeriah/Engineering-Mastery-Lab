/** A receipt failed size, JSON, schema or AdapterResult validation. */
export class RunReceiptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunReceiptError";
  }
}
