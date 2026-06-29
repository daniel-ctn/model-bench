declare module "png-to-ico" {
  /** Combine one or more PNG buffers/paths into a single .ico buffer. */
  const pngToIco: (
    input: Buffer | string | Array<Buffer | string>,
  ) => Promise<Buffer>;
  export default pngToIco;
}
