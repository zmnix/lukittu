import { NextRequest, NextResponse } from 'next/server';

type IExternalLicenseVerifyResponse = {
  data: any;
  result: {
    timestamp: Date;
    valid: boolean;
    details: string;
    code: string;
  };
};

export async function POST(
  request: NextRequest,
): Promise<NextResponse<IExternalLicenseVerifyResponse>> {}
