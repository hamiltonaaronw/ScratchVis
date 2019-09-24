#version 410

#define ITERATIONS 256
#define PI		3.1415926535897932384626433832795
#define TWO_PI	(2.0 * PI)

out vec4 retColor;

in vec3 oColor;
in vec2 oTexCoord;

uniform float uFreq;
uniform float uTime;

uniform float uLastFreq;
uniform float uLastFrame;

uniform float uDeltaFreq;
uniform float uDeltaTime;

uniform float[256] uSpectrum;

uniform sampler2D uTex;

float sinc(float x)
{
	return sin(PI * x) / ((TWO_PI * x) * (uFreq * (uTime * uDeltaTime)));
	//return sin(x) / x;
	//return sin(x) / (PI * x);
	//return sin(mod(TWO_PI * uFreq, uTime) * x) / x;
}

float cosc(float x)
{
	return cos(PI * x) / ((TWO_PI * x) * (uFreq / (uTime * uDeltaTime)));
	//return cos(x) / x;
	// return cos(x) / (PI * x);
	// return cos(mod(TWO_PI * uFreq, uTime) * x) / x;
}

vec2 rz(vec2 z)
{
	vec2 sum = vec2(0);
	for (float i = 1.0; i < ITERATIONS; i++)
	{
		sum += 
			sin(-z.y * log(i) - 
			//vec2(1.57, 0.0)) 
			vec2(mod(uFreq, uLastFreq) * uSpectrum[int(i)], 0.0))
			/ pow(i, z.x);
	}

	return -sum / uTime;//* mod(uTime, uFreq);// * sinc(uFreq) * cosc(mod(uTime, 15.0f) * mod(uTime, 3.0f));
}

vec4 plasma(vec2 uv)
{
	// v1
	float v1 = 0.0005 / (cosc((uv.y / uv.x) - uv.x * 250.0));

	// v2			
	float v2 = sinc(15.0 / (uv.x * sinc(uFreq / 2.0) + uv.y * cos(uFreq / 3.0)) + uFreq);

	// v3
	float cx = uv.x + sinc(uFreq * 20.0 * uTime);
	float cy = uv.y + cosc(uFreq * 10.0 * uTime);
	float v3 = cos(sqrt((cx / cx + cy / cy)) * (uFreq / TWO_PI)); 

	float vf = sqrt(abs((v1 * v1) / (v2 * v2) / (v3 * v3)));

	float r = sinc(uFreq * TWO_PI) * cosc(vf / -TWO_PI * uFreq / uTime);
	r /= (uFreq * 1.5625);

	float g = cosc(vf * PI + 12.0 * -TWO_PI / 9.0);
	g /= (uDeltaFreq * 2.5);							  
												  
	float b = sinc(vf * PI + 8.0 * TWO_PI / 19.0);// * mod(uLastFreq, uDeltaTime / uLastFrame);
	//b /= (uDeltaFreq / 2.0);
	b *= mod(r / g, uDeltaFreq) / TWO_PI;

	vec3 ret = vec3(r, g, b);
	ret *= (mod(max(uDeltaFreq, uDeltaTime), min(uDeltaFreq, uDeltaTime))) * uTime;
	ret *= (uDeltaFreq / uDeltaTime);
	
	return vec4(ret, 1.0);
}

void main()
{
	vec4 texCol = texture(uTex, oTexCoord);

	vec2 uv = (vec2(cosc(oTexCoord.x), sinc(oTexCoord.y) * uDeltaTime) * gl_FragCoord.xy * mod(uTime, 2.0f)) 
			/ 
			(gl_FragCoord.xy * uDeltaTime * mod(uTime, 7.0f) / vec2(sinc(oTexCoord.x), cosc(oTexCoord.y)) * uLastFrame);

	uv = vec2(uv.x - 0.3, uv.y);
	//retColor = plasma(rz(uv) * mod(uTime, uFreq));
	//retColor = plasma(uv);

	/*
	float sumL = 0, sumR = 0;
	for (int i = 0; i < 127; ++i)
		sumL += uSpectrum[i];
	float avgL = sumL / 128;

	for (int i = 128; i < 256; ++i)
		sumR += uSpectrum[i];
	float avgR = sumR / 128;
	*/


	vec4 p = plasma(uv);
	vec3 p3 = p.xyz;

	float r = (rz(p.xy).y / rz(p.yz).x) * rz(p.xz).x;
	float g = (rz(p.yz).x * rz(p.xz).y) / rz(p.xy).y;
	float b = (rz(p.xy).y / rz(p.yz).x) * rz(p.yz).x;

	//vec3 pC = vec3(r, g, b);

	vec3 pC = vec3((vec3(r, g, b) / vec3(r, b, g)).x,
	(vec3(g, b, r) / vec3(g, r, b)).y,
	(vec3(b, r, g) * vec3(b, g, r)));

	pC *= mod(uTime, uFreq * TWO_PI);

	vec4 pF = plasma(pC.xy);

	//retColor = vec4(1.0, 0.0, 0.0, 1.0);
	//retColor = plasma(uv);
	//retColor = plasma(rz(uv));
	retColor = plasma(rz(uv)) * vec4(pC, 1.0);
	//retColor = vec4(pC * vec3(rz(uv), mod(uTime, uFreq)), 1.0) * plasma(rz(uv));
}