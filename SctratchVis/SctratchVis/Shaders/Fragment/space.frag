#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

float scale;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
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
	float c = cos(a);
	float s = sin(a);
	mat2 ret = mat2(
		c, -s,
		s, c
	);
	return ret;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p *= rot(uTime);
	
	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = vec3(
		uSpectrum[32] / f,
		uSpectrum[64] * f,
		uSpectrum[128] * f
	) + sin(uFreq);

	float seg = 7.0 + floor(fract(f * 100.0) * 10.0 / length(vf));

	float t = sin(uTime * 0.2) * f;
	float a = atan(p.x, p.y) / TAU * seg;
	float d = length(p) - mix(3.0 * sin(3.0 * t + f), 0.5, cos(fract(a) - 0.5));

	vec3 co = vec3(1.0) - sign(d) * vec3(0.1, 0.4, 0.7);
	co *= 1.0 - exp(-2.0 * abs(d));
	co *= 0.8 + 0.2 * cos(120.0 * abs(d) + t * 10.0);
	co = mix(co, vf, 1.0 - smoothstep(0.0, 0.02, abs(d)));

	c = co;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.01 ? c : vec3(0.0);

	return ret;
}


void main()
{
	//vec2 uv = gl_FragCoord.xy / uRes.xy / 2.0;
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) / 2.0;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}