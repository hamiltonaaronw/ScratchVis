#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
//uniform float uDeltaFreq;
uniform float uTime;
//uniform float uLastFrame;
//uniform float uDeltaTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 9.0 - 3.0) -1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	p *= clamp(sin(uTime), 1.0 - uFreq, 1.0 + uFreq);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	//float f = min(abs(uFreq), abs(uLastFreq)) + abs((abs(uFreq - uLastFreq)) / 2.0);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);

	float t = fract(uTime);
	vec2 r = uRes.xy;

	// position
	//p = (p - r * 0.5) * 0.4 / r.y;
	// breathing effect
	p += p * sinc(dot(p, p) * 5.0  - uTime) * (0.4 + f);
	p *= rot(t * 0.3);
	float df = (uTime + smoothstep(f, -ff, uFreq)) * 0.1;

	vec3 vf = vec3(
		uSpectrum[32] / df,
		uSpectrum[64] * f,
		atan(uSpectrum[128], ff / (t / df))
	) + sin(uFreq);
	c += vf * 0.25;

	// color
	for (float i = 0.5; i < 8.0; i++)
	{
	 	//fractal and rot
		p = abs(2.0 * fract(p - 0.5) - 1.0) * 
				mat2(cos(0.01 * df * i * i + abs(df - 0.78 - sin(fract(f * t))) * vec4(1.0, 7.0, 3.0, 1.0)));
	
		// color
		c += exp(-abs(p.y) * (5.0 / f)) * (cos(vec3(2.0, 3.0, 1.0) * i) * 0.5 + 0.5);
	}

	c.gb *= 0.5;
	//c *= abs(c - vf);
	//c = mix(c, c * abs(c - vf), abs(sin(uTime) - uFreq));
	c *= 0.5;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.009 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = gl_FragCoord.xy / uRes.xy * 2.0 - 2.0;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}