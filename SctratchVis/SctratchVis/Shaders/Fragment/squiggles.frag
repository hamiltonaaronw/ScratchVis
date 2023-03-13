#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

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
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(p.x, p.y, 1.0);

	//p *= rot(uTime * 0.2);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = (uFreq - uLastFreq) + f + tm + ff + tf;
	vec3 vf = vec3(
		uSpectrum[32] / f,
		uSpectrum[64] - f,
		uSpectrum[128] * f
	) + sin(uFreq);
	fsum /= length(vf);

	c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	//uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);
	uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
	vec4 ret;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}
