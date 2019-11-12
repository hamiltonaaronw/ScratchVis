#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

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
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 col(vec2 p)
{
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	//vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
	vec2 q = p;

	vec3 c = vec3(
		sin(0.75 * f), 
		fract(sin(0.6 / f)) * uFreq, 
		sin(0.5 / f)) * 1.5 / fract(uFreq * 10.0);
	//c *= f;

	p *= 1.4 + sin(uTime * 1.79) * 0.05;

	p.y += sin(p.x * 3.0 + uTime * 1.4) * 0.1;

	float d = length(p);
	float a = atan(p.y / p.x) * 24.0;
	float l = 2.5 / abs(length(p) - 0.1 + sin(a * 4.0 + uTime * 3.5) * 0.04);

	c = l * c * 2.0 - d * d;

	d = smoothstep(0.75, 0.8, d);

	c = clamp(c, vec3(0.0), vec3(1.0)) * d;
	c = clamp(c, vec3(0.0), vec3(1.0));

	vec3 i = vec3(1.0, 0.4, 0.4) * 0.07 /
		abs(sin(uTime / f + (q.y * q.y) * f));
	i *= 1.0 - d * f;
	i = clamp(i, vec3(0.0), vec3(1.0));

	c = mix(i, c, d);
	c = fract(c);

	vec3 ret;

	ret = c;

	return ret;
}

vec3 cols(vec2 p)
{
	vec3 ret;

	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	//float fr = fract(atan(TAU, f * sinc(uTime)) * exp(cosc(uTime + f)));// + sin(uTime);
	float fr = fract(f)  / uDeltaFreq > abs(sin(uTime)) + uDeltaFreq ? sin(uTime) : f;
	
	p *= rot(fr);

	ret = col(p);
	ret += col(p - 1.5);
	ret += col(p + 1.5);

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	vec4 ret;

	ret = vec4(cols(uv), 1.0);
	retColor = ret;

}