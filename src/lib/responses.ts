interface Response {
    code: number,
    error?: boolean,
    message: string,
    data: unknown
}

export const NewResponse = (options: Response) => {
    let isError = false;
    isError = options.code >= 400;

    options.error = isError;

    return new Response(JSON.stringify(options), { status: options.code })
}
