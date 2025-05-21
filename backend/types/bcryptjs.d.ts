declare module "bcryptjs" {
    /**
     * Generate a salt synchronously
     * @param rounds Number of rounds to use, defaults to 10 if omitted
     * @returns Generated salt
     */
    export function genSaltSync(rounds?: number): string
  
    /**
     * Generate a salt asynchronously
     * @param rounds Number of rounds to use, defaults to 10 if omitted
     * @param callback Callback receiving the error, if any, and the generated salt
     */
    export function genSalt(rounds?: number): Promise<string>
    export function genSalt(callback: (err: Error | null, salt: string) => void): void
    export function genSalt(rounds: number, callback: (err: Error | null, salt: string) => void): void
  
    /**
     * Hash data synchronously
     * @param data Data to hash
     * @param salt Salt to use, can be a salt string or the number of rounds to generate a salt
     * @returns Hashed data
     */
    export function hashSync(data: string, salt: string | number): string
  
    /**
     * Hash data asynchronously
     * @param data Data to hash
     * @param salt Salt to use, can be a salt string or the number of rounds to generate a salt
     * @param callback Callback receiving the error, if any, and the hashed data
     */
    export function hash(data: string, salt: string | number): Promise<string>
    export function hash(data: string, salt: string | number, callback: (err: Error | null, hash: string) => void): void
  
    /**
     * Compare data with hash synchronously
     * @param data Data to compare
     * @param hash Hash to compare to
     * @returns true if matching, false otherwise
     */
    export function compareSync(data: string, hash: string): boolean
  
    /**
     * Compare data with hash asynchronously
     * @param data Data to compare
     * @param hash Hash to compare to
     * @param callback Callback receiving the error, if any, and the comparison result
     */
    export function compare(data: string, hash: string): Promise<boolean>
    export function compare(data: string, hash: string, callback: (err: Error | null, same: boolean) => void): void
  
    /**
     * Get number of rounds used to create hash
     * @param hash Hash created with bcryptjs
     * @returns Number of rounds used to create hash
     */
    export function getRounds(hash: string): number
  }
  