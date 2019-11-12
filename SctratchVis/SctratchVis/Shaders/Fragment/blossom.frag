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

uniform vec2 uRes;

float sinc(float x)
{
//	return sin(PI * x) / ((TWO_PI * x) * (uFreq * (uTime * uDeltaTime)));
	return sin(x) / x;
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

vec3 col(vec2 p)
{
	vec3 ret;
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	f = fract(f * 10.0);
	float ft = sin(uTime) + f;
	
	float r = 0.9 * fract(f * 10.0), 
			g = 0.4 + sinc(ft), 
			b = 0.1 / f;
	float a = atan(p.y / p.x) * 20.0;
	float l;

	for (int i = 0; i < 8; i++)
	{
		r *= abs(f - fract(exp(uSpectrum[i * 32])));
		g *= fract(uSpectrum[i]);
		b *= atan(mod(fract(uSpectrum[i * 16] * 100.0), 0.5) - f);

		float s = (atan(ft, f) + float(i) * 0.25);

		float t = mod(float(i), 2.0) == 0.0 ? sin(uTime) + 0.1 : -sin(uTime) - 0.1;
		t /= f;
		t *= fract(uTime) + uDeltaTime;
		t *= 0.5;

		float l = 0.05 / abs(length(p) - s + sin(a + t + float(i)  * 3.5) * 0.1);

		vec3 c = vec3(r, g, b);
		c *= 0.5 + sin(a + uTime * 0.03) * 0.03;// / f;
		ret += l * c;
	}

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}